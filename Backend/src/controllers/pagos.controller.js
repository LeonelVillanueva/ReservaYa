const { supabase } = require('../config/supabase');
const { ROLES, ESTADOS_PAGO, ESTADOS_RESERVA, METODOS_PAGO } = require('../utils/constants');
const { error: sendError, notFound, forbidden, success } = require('../utils/responses');
const { uploadFile } = require('../services/storage.service');
const {
  verificarComprobante,
  notificarResultadoManual,
  generarPHash,
  compararPHash,
  calcularRiesgoUsuario,
} = require('../services/ocr.service');

const pagosController = {
  /**
   * POST /api/pagos/:id/verificar-comprobante
   * Sube imagen del comprobante de transferencia y la verifica con OCR.
   * El usuario sube el comprobante para un pago en estado 'pendiente'.
   */
  async verificarComprobanteTransferencia(req, res) {
    try {
      const pagoId = parseInt(req.params.id, 10);
      const file = req.file;

      if (!file) {
        return sendError(res, 'Se requiere imagen del comprobante', 400);
      }

      // Obtener el pago
      const { data: pago, error: errPago } = await supabase
        .from('pagos')
        .select('*, reserva:reservas!reserva_id(*)')
        .eq('id', pagoId)
        .single();

      if (errPago || !pago) {
        return notFound(res, 'Pago no encontrado');
      }

      // Verificar que el pago esté en estado pendiente
      if (pago.estado !== ESTADOS_PAGO.PENDIENTE) {
        return sendError(res, 'Este pago ya fue procesado', 400);
      }

      // Verificar que sea el dueño de la reserva o un manager
      const esManager = req.user?.rol_id === ROLES.MANAGER;
      if (!esManager && pago.reserva?.usuario_id !== req.user.id) {
        return forbidden(res, 'No tiene permisos para este pago');
      }

      // Subir imagen del comprobante a Supabase Storage
      const uploaded = await uploadFile('comprobantes', file);

      // Incrementar intentos
      const intentos = (pago.intentos_verificacion || 0) + 1;

      // ================================================================
      // BARRERA 1: OCR + Análisis de autenticidad de imagen
      // ================================================================
      const resultadoOCR = await verificarComprobante(
        file.buffer,
        file.originalname,
        file.mimetype,
        pago.monto,
        pagoId
      );

      // ================================================================
      // BARRERA 2A: Huella digital perceptual (pHash)
      // ================================================================
      let imagenDuplicada = false;
      let pHashActual = null;
      let pHashDuplicadoDe = null;

      try {
        pHashActual = await generarPHash(file.buffer);
        console.log(`[pagos.controller] pHash generado: ${pHashActual}`);

        if (pHashActual) {
          // Buscar pagos anteriores con pHash
          const { data: pagosConHash } = await supabase
            .from('pagos')
            .select('id, comprobante_phash')
            .neq('id', pagoId)
            .not('comprobante_phash', 'is', null)
            .in('estado', [ESTADOS_PAGO.COMPLETADO, ESTADOS_PAGO.PENDIENTE_REVISION]);

          if (pagosConHash && pagosConHash.length > 0) {
            for (const p of pagosConHash) {
              const distancia = compararPHash(pHashActual, p.comprobante_phash);
              if (distancia < 10) { // < 10 de 64 bits = muy similar
                imagenDuplicada = true;
                pHashDuplicadoDe = p.id;
                console.log(`[pagos.controller] Imagen duplicada: pHash distancia=${distancia} con pago #${p.id}`);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[pagos.controller] Error en pHash:', err.message);
      }

      // ================================================================
      // BARRERA 2B: Chequeo de referencia duplicada
      // ================================================================
      let referenciaDuplicada = false;
      const referenciaExtraida = resultadoOCR.datos_extraidos?.referencia;

      if (referenciaExtraida) {
        const { data: pagosRef } = await supabase
          .from('pagos')
          .select('id, ocr_resultado')
          .neq('id', pagoId)
          .in('estado', [ESTADOS_PAGO.COMPLETADO, ESTADOS_PAGO.PENDIENTE_REVISION])
          .not('ocr_resultado', 'is', null);

        if (pagosRef && pagosRef.length > 0) {
          referenciaDuplicada = pagosRef.some(p => {
            const refAnterior = p.ocr_resultado?.datos_extraidos?.referencia;
            return refAnterior && refAnterior.toLowerCase() === referenciaExtraida.toLowerCase();
          });
        }

        if (referenciaDuplicada) {
          console.log(`[pagos.controller] Referencia duplicada detectada: ${referenciaExtraida}`);
        }
      }

      // ================================================================
      // BARRERA 2C: Scoring de riesgo por usuario
      // ================================================================
      const usuarioId = pago.reserva?.usuario_id || req.user.id;
      const riesgoUsuario = await calcularRiesgoUsuario(usuarioId, pago.reserva);
      console.log(`[pagos.controller] Riesgo usuario: nivel=${riesgoUsuario.nivel}, puntuación=${riesgoUsuario.puntuacion}, factores: ${riesgoUsuario.factores.join('; ')}`);

      // ================================================================
      // REGLAS DE ESCALAMIENTO (combinan todas las señales)
      // ================================================================

      // Agregar segunda barrera al resultado OCR
      resultadoOCR.segunda_barrera = {
        phash: pHashActual,
        imagen_duplicada: imagenDuplicada,
        imagen_duplicada_de: pHashDuplicadoDe,
        referencia_duplicada: referenciaDuplicada,
        riesgo_usuario: riesgoUsuario,
      };

      // Marcar inválido si cualquier segunda barrera falla
      if (imagenDuplicada) {
        resultadoOCR.valido = false;
        const motivo = `Imagen perceptualmente idéntica al comprobante del pago #${pHashDuplicadoDe}`;
        resultadoOCR.motivo_rechazo = resultadoOCR.motivo_rechazo
          ? `${motivo}. ${resultadoOCR.motivo_rechazo}`
          : motivo;
      }

      if (referenciaDuplicada) {
        resultadoOCR.valido = false;
        const motivo = 'Referencia de transacción ya utilizada en otro pago';
        resultadoOCR.motivo_rechazo = resultadoOCR.motivo_rechazo
          ? `${motivo}. ${resultadoOCR.motivo_rechazo}`
          : motivo;
      }

      // Decisión final con reglas de escalamiento
      // REGLA: si no se aprueba, SIEMPRE va a revisión manual.
      // El cliente nunca ve un rechazo directo — solo "en revisión".
      let aprobar = resultadoOCR.valido;

      if (imagenDuplicada || referenciaDuplicada) {
        aprobar = false;
      } else if (riesgoUsuario.nivel === 'alto') {
        aprobar = false;
        if (!resultadoOCR.motivo_rechazo) {
          resultadoOCR.motivo_rechazo = `Usuario con riesgo alto: ${riesgoUsuario.factores.join('; ')}`;
        }
      } else if (riesgoUsuario.nivel === 'medio' && resultadoOCR.confianza < 0.80) {
        aprobar = false;
        if (!resultadoOCR.motivo_rechazo) {
          resultadoOCR.motivo_rechazo = `Riesgo medio con confianza insuficiente (${resultadoOCR.confianza})`;
        }
      }

      // ================================================================
      // GUARDAR RESULTADO EN BD
      // ================================================================
      const updateData = {
        comprobante_url: uploaded.url,
        comprobante_phash: pHashActual,
        ocr_resultado: resultadoOCR,
        intentos_verificacion: intentos,
      };

      if (aprobar) {
        updateData.estado = ESTADOS_PAGO.COMPLETADO;
        updateData.fecha_pago = new Date().toISOString();
      } else {
        // Si no fue aprobado, SIEMPRE va a revisión manual.
        // El cliente solo ve "en revisión", nunca un rechazo directo.
        updateData.estado = ESTADOS_PAGO.PENDIENTE_REVISION;
      }

      const { data: pagoActualizado, error: errUpdate } = await supabase
        .from('pagos')
        .update(updateData)
        .eq('id', pagoId)
        .select()
        .single();

      if (errUpdate) throw errUpdate;

      // Si fue aprobado, actualizar estado de la reserva
      if (aprobar && pago.reserva) {
        await supabase
          .from('reservas')
          .update({ estado_id: ESTADOS_RESERVA.PENDIENTE, pago_anticipo_id: pagoId })
          .eq('id', pago.reserva.id);
      }

      // Respuesta al cliente: NO incluir motivos detallados de rechazo.
      // El cliente solo ve si fue aprobado o enviado a revisión.
      // Los detalles completos quedan en ocr_resultado (BD) para el manager.
      res.json({
        pago: pagoActualizado,
        verificacion: {
          valido: aprobar,
          enviado_a_revision: updateData.estado === ESTADOS_PAGO.PENDIENTE_REVISION,
        },
      });
    } catch (error) {
      console.error('[pagos.controller] Error verificando comprobante:', error.message);
      sendError(res, error.message);
    }
  },

  /**
   * GET /api/pagos/pendientes-revision
   * Lista pagos pendientes de revisión manual (solo manager).
   */
  async getPendientesRevision(req, res) {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          reserva:reservas!reserva_id(
            id, fecha, hora, cantidad_personas, notas,
            usuario:usuarios!usuario_id(id, nombre, apellido, email),
            nombre_cliente, telefono_cliente, reserva_por_llamada
          )
        `)
        .eq('estado', ESTADOS_PAGO.PENDIENTE_REVISION)
        .order('id', { ascending: true });

      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  /**
   * PATCH /api/pagos/:id/revision-manual
   * Manager aprueba o rechaza un pago pendiente de revisión.
   */
  async revisionManual(req, res) {
    try {
      const pagoId = parseInt(req.params.id, 10);
      const { aprobado, motivo } = req.body;

      if (typeof aprobado !== 'boolean') {
        return sendError(res, 'Se requiere el campo "aprobado" (true/false)', 400);
      }

      // Obtener el pago
      const { data: pago, error: errPago } = await supabase
        .from('pagos')
        .select('*, reserva:reservas!reserva_id(*)')
        .eq('id', pagoId)
        .single();

      if (errPago || !pago) {
        return notFound(res, 'Pago no encontrado');
      }

      if (pago.estado !== ESTADOS_PAGO.PENDIENTE_REVISION) {
        return sendError(res, 'Este pago no está pendiente de revisión', 400);
      }

      const nuevoEstado = aprobado ? ESTADOS_PAGO.COMPLETADO : ESTADOS_PAGO.FALLIDO;

      const { data: pagoActualizado, error: errUpdate } = await supabase
        .from('pagos')
        .update({
          estado: nuevoEstado,
          // revisado_por es UUID (auth.users), pero req.user.id es integer (usuarios).
          // Se guarda el ID del revisor dentro de ocr_resultado.revision_manual.
          fecha_pago: aprobado ? new Date().toISOString() : null,
          ocr_resultado: {
            ...pago.ocr_resultado,
            revision_manual: {
              aprobado,
              motivo: motivo || null,
              revisado_por_id: req.user.id,
              revisado_por_nombre: `${req.user.nombre || ''} ${req.user.apellido || ''}`.trim(),
              fecha_revision: new Date().toISOString(),
            },
          },
        })
        .eq('id', pagoId)
        .select()
        .single();

      if (errUpdate) throw errUpdate;

      // Actualizar estado de la reserva
      if (pago.reserva) {
        if (aprobado) {
          // Pago aprobado: reserva pasa a pendiente (confirmada con pago)
          await supabase
            .from('reservas')
            .update({ estado_id: ESTADOS_RESERVA.PENDIENTE, pago_anticipo_id: pagoId })
            .eq('id', pago.reserva.id);
        } else {
          // Pago rechazado: cancelar la reserva
          await supabase
            .from('reservas')
            .update({ estado_id: ESTADOS_RESERVA.CANCELADA })
            .eq('id', pago.reserva.id);
        }
      }

      // Notificar al microservicio OCR para aprendizaje (async, no bloquea)
      notificarResultadoManual(pagoId, aprobado).catch(() => {});

      res.json({
        pago: pagoActualizado,
        reserva_actualizada: aprobado ? 'pendiente' : 'cancelada',
      });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  /**
   * GET /api/pagos/:id
   * Obtener detalle de un pago (dueño o manager).
   */
  async getById(req, res) {
    try {
      const pagoId = parseInt(req.params.id, 10);

      const { data: pago, error } = await supabase
        .from('pagos')
        .select(`
          *,
          reserva:reservas!reserva_id(
            id, fecha, hora, cantidad_personas,
            usuario:usuarios!usuario_id(id, nombre, apellido, email)
          )
        `)
        .eq('id', pagoId)
        .single();

      if (error || !pago) {
        return notFound(res, 'Pago no encontrado');
      }

      // Verificar permisos
      const esManager = req.user?.rol_id === ROLES.MANAGER;
      if (!esManager && pago.reserva?.usuario?.id !== req.user.id) {
        return forbidden(res, 'No tiene permisos para ver este pago');
      }

      res.json(pago);
    } catch (error) {
      sendError(res, error.message);
    }
  },
};

module.exports = pagosController;
