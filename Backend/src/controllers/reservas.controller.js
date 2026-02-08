const { supabase } = require('../config/supabase');
const { ROLES, ESTADOS_RESERVA, METODOS_PAGO, ESTADOS_PAGO } = require('../utils/constants');
const reservasService = require('../services/reservas.service');
const { fechaHoy, sumarDias } = require('../utils/date.utils');
const { error: sendError, notFound, forbidden } = require('../utils/responses');

// Helper: solo el dueño de la reserva o un manager pueden modificar (fuera del objeto para no depender de "this" en rutas)
async function assertPuedeModificarReserva(req, id) {
  const { data: r } = await supabase.from('reservas').select('usuario_id').eq('id', id).single();
  if (!r) return { error: 'Reserva no encontrada', status: 404 };
  const esManager = req.user?.rol_id === ROLES.MANAGER;
  if (!esManager && r.usuario_id !== req.user.id) return { error: 'No tiene permisos para esta reserva', status: 403 };
  return {};
}

const reservasController = {
  // GET /api/reservas — clientes solo ven las propias; manager puede filtrar por usuario_id
  async getAll(req, res) {
    try {
      const { fecha, estado_id, usuario_id } = req.query;
      const esManager = req.user?.rol_id === ROLES.MANAGER;

      let query = supabase
        .from('reservas')
        .select(`
          *,
          usuario:usuarios!usuario_id(id, nombre, apellido, email, telefono),
          estado:estados_reserva(id, nombre),
          mesa:mesas(id, numero_mesa, capacidad)
        `);

      if (!esManager) {
        query = query.eq('usuario_id', req.user.id);
      } else if (usuario_id) {
        query = query.eq('usuario_id', usuario_id);
      }
      if (fecha) query = query.eq('fecha', fecha);
      if (estado_id) query = query.eq('estado_id', estado_id);

      const { data, error } = await query.order('fecha', { ascending: true }).order('hora', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // GET /api/reservas/:id — cliente solo puede ver sus propias reservas
  async getById(req, res) {
    try {
      const { id } = req.params;
      const esManager = req.user?.rol_id === ROLES.MANAGER;

      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          usuario:usuarios!usuario_id(id, nombre, apellido, email, telefono),
          creador:usuarios!creado_por_id(id, nombre, apellido),
          estado:estados_reserva(id, nombre),
          mesa:mesas(id, numero_mesa, capacidad),
          pago_anticipo:pagos!pago_anticipo_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return notFound(res, 'Reserva no encontrada');
      if (!esManager && data.usuario_id !== req.user.id) {
        return forbidden(res, 'No tiene permisos para ver esta reserva');
      }

      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // POST /api/reservas — cliente solo puede crear para sí; manager puede asignar usuario
  async create(req, res) {
    try {
      const {
        usuario_id,
        creado_por_id,
        reserva_por_llamada,
        nombre_cliente,
        telefono_cliente,
        mesa_id,
        mesa_ids,
        fecha,
        hora,
        cantidad_personas,
        duracion_estimada_minutos,
        notas,
        monto_anticipo,
        metodo_pago_id
      } = req.body;

      const diasMax = parseInt(await reservasService.obtenerParametro('dias_anticipo_reserva_max'), 10) || 4;
      const maxFecha = sumarDias(fechaHoy(), diasMax);
      if (fecha > maxFecha) {
        return sendError(res, `La reserva no puede ser más de ${diasMax} días desde hoy`, 400);
      }

      const duracion = parseInt(duracion_estimada_minutos, 10) || 120;
      const validacion = await reservasService.validarReservaNoAntesDelCierre(fecha, hora, duracion);
      if (!validacion.valido) {
        return sendError(res, validacion.error, 400);
      }

      const ids = Array.isArray(mesa_ids) && mesa_ids.length > 0
        ? mesa_ids
        : (mesa_id ? [mesa_id] : []);
      if (ids.length === 0) {
        return sendError(res, 'Se requiere al menos una mesa (mesa_id o mesa_ids)', 400);
      }
      const primeraMesaId = ids[0];

      const esManager = req.user?.rol_id === ROLES.MANAGER;
      const esPorLlamada = Boolean(reserva_por_llamada);
      if (esPorLlamada && !esManager) {
        return forbidden(res, 'Solo el administrador puede registrar reservas por llamada');
      }
      if (esPorLlamada) {
        const nombre = (nombre_cliente && String(nombre_cliente).trim()) || '';
        const telefono = (telefono_cliente && String(telefono_cliente).trim()) || '';
        if (!nombre || !telefono) {
          return sendError(res, 'En reserva por llamada son obligatorios el nombre y el teléfono del cliente', 400);
        }
      }

      const uid = esPorLlamada ? null : (esManager && usuario_id ? usuario_id : req.user.id);
      const cid = esPorLlamada ? req.user.id : (esManager && creado_por_id != null ? creado_por_id : req.user.id);

      // Determinar si es transferencia (requiere verificación de comprobante)
      const esTransferencia = metodo_pago_id === METODOS_PAGO.TRANSFERENCIA;
      // Manager por llamada o pago en efectivo no necesita verificación de comprobante
      const pagoInmediato = !esTransferencia || (esPorLlamada && esManager);

      const payloadReserva = {
        usuario_id: uid,
        creado_por_id: cid,
        mesa_id: primeraMesaId,
        fecha,
        hora,
        cantidad_personas,
        duracion_estimada_minutos,
        estado_id: pagoInmediato ? ESTADOS_RESERVA.PENDIENTE : ESTADOS_RESERVA.PENDIENTE_PAGO,
        notas
      };
      if (esPorLlamada) {
        payloadReserva.reserva_por_llamada = true;
        payloadReserva.nombre_cliente = String(nombre_cliente).trim();
        payloadReserva.telefono_cliente = String(telefono_cliente).trim();
      }

      const { data: reserva, error: errReserva } = await supabase
        .from('reservas')
        .insert(payloadReserva)
        .select()
        .single();

      if (errReserva) throw errReserva;

      try {
        await supabase.from('reserva_mesas').insert(
          ids.map(mid => ({ reserva_id: reserva.id, mesa_id: mid }))
        );
      } catch (_) {
        // tabla reserva_mesas puede no existir; reserva ya tiene mesa_id
      }

      const { data: pago, error: errPago } = await supabase
        .from('pagos')
        .insert({
          reserva_id: reserva.id,
          tipo: 'anticipo',
          monto: monto_anticipo,
          metodo_pago_id,
          estado: pagoInmediato ? ESTADOS_PAGO.COMPLETADO : ESTADOS_PAGO.PENDIENTE,
          fecha_pago: pagoInmediato ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (errPago) throw errPago;

      // Solo vincular pago si fue inmediato (transferencia lo vincula tras verificar comprobante)
      if (pagoInmediato) {
        const { data: reservaActualizada, error: errUpdate } = await supabase
          .from('reservas')
          .update({ pago_anticipo_id: pago.id })
          .eq('id', reserva.id)
          .select()
          .single();

        if (errUpdate) throw errUpdate;
        res.status(201).json({ reserva: reservaActualizada, pago });
      } else {
        // Transferencia: la reserva queda en pendiente_pago hasta que suba comprobante
        res.status(201).json({
          reserva,
          pago,
          requiere_comprobante: true,
          mensaje: 'Reserva creada. Suba el comprobante de transferencia para confirmar el pago.',
        });
      }
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PUT /api/reservas/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);

      const { fecha, hora, cantidad_personas, mesa_id, notas } = req.body;

      const { data, error } = await supabase
        .from('reservas')
        .update({ fecha, hora, cantidad_personas, mesa_id, notas })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PATCH /api/reservas/:id/cancelar
  async cancelar(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);

      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: 3 }) // cancelada
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ message: 'Reserva cancelada', reserva: data });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PATCH /api/reservas/:id/confirmar — confirmar llegada: ocupa mesas y pasa a confirmada
  async confirmar(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);

      const { data: reserva } = await supabase
        .from('reservas')
        .select('fecha, hora, duracion_estimada_minutos, mesa_id')
        .eq('id', id)
        .single();
      if (!reserva) return notFound(res, 'Reserva no encontrada');

      let mesaIds = [reserva.mesa_id];
      try {
        const { data: rm } = await supabase.from('reserva_mesas').select('mesa_id').eq('reserva_id', id);
        if (rm && rm.length > 0) mesaIds = rm.map(r => r.mesa_id);
      } catch (_) {}

      const duracion = reserva.duracion_estimada_minutos || 120;
      for (const mesaId of mesaIds) {
        if (mesaId) await reservasService.crearAsignacionMesa(id, mesaId, reserva.fecha, reserva.hora, duracion);
      }

      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: ESTADOS_RESERVA.CONFIRMADA })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ message: 'Reserva confirmada', reserva: data });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PATCH /api/reservas/:id/iniciar-gracia — 15 min de gracia (manager)
  async iniciarGracia(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);

      const hasta = new Date(Date.now() + 15 * 60 * 1000);
      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: ESTADOS_RESERVA.EN_GRACIA, gracia_hasta: hasta.toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ message: 'Gracia de 15 min iniciada', reserva: data, gracia_hasta: hasta.toISOString() });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PATCH /api/reservas/:id/expirar-gracia — liberar mesas y marcar no-show (llamado al terminar el cronómetro)
  async expirarGracia(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);

      const { data: r } = await supabase.from('reservas').select('estado_id, gracia_hasta').eq('id', id).single();
      if (!r) return notFound(res, 'Reserva no encontrada');
      if (r.estado_id !== ESTADOS_RESERVA.EN_GRACIA) {
        return sendError(res, 'La reserva no está en período de gracia', 400);
      }

      try {
        await reservasService.liberarAsignacionMesa(id);
      } catch (_) {}
      try {
        await supabase.from('reserva_mesas').delete().eq('reserva_id', id);
      } catch (_) {}
      await supabase.from('reservas').update({
        mesa_id: null,
        estado_id: ESTADOS_RESERVA.NO_SHOW,
        gracia_hasta: null
      }).eq('id', id);

      const { data: reserva } = await supabase.from('reservas').select('*').eq('id', id).single();
      res.json({ message: 'Gracia expirada; mesas liberadas', reserva });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PATCH /api/reservas/:id/no-show — típicamente manager; libera mesas si estaban ocupadas
  async marcarNoShow(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);

      try {
        await reservasService.liberarAsignacionMesa(id);
      } catch (_) {}

      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: 5 }) // no_show
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ message: 'Reserva marcada como no-show', reserva: data });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PATCH /api/reservas/:id/completar — típicamente manager; libera mesas para que vuelvan a disponible
  async completar(req, res) {
    try {
      const { id } = req.params;
      const fail = await assertPuedeModificarReserva(req, id);
      if (fail.error) return sendError(res, fail.error, fail.status);
      const { monto_cobrado, anticipo_aplicado, metodo_pago_id } = req.body;

      // 0. Liberar asignaciones de mesa para que las mesas vuelvan a estado disponible
      try {
        await reservasService.liberarAsignacionMesa(id);
      } catch (errLib) {
        // Si no hay asignaciones o falla, continuar con el pago y cambio de estado
      }
      
      // 1. Crear pago cuenta_final
      const { data: pago, error: errPago } = await supabase
        .from('pagos')
        .insert({
          reserva_id: id,
          tipo: 'cuenta_final',
          monto: monto_cobrado,
          anticipo_aplicado,
          metodo_pago_id,
          estado: 'completado',
          fecha_pago: new Date().toISOString()
        })
        .select()
        .single();
      
      if (errPago) throw errPago;
      
      // 2. Actualizar estado de reserva a completada
      const { data: reserva, error: errReserva } = await supabase
        .from('reservas')
        .update({ estado_id: 4 }) // completada
        .eq('id', id)
        .select()
        .single();
      
      if (errReserva) throw errReserva;
      
      res.json({ message: 'Reserva completada', reserva, pago_cuenta_final: pago });
    } catch (error) {
      sendError(res, error.message);
    }
  }
};

module.exports = reservasController;
