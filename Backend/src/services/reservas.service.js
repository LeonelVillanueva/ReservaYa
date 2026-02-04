/**
 * Servicio de reservas - Lógica de negocio
 */

const { supabase } = require('../config/supabase');
const { ESTADOS_RESERVA, TIPOS_PAGO, ESTADOS_PAGO, ESTADOS_ASIGNACION } = require('../utils/constants');
const { calcularHoraFin, diferenciaHorasDesdeAhora, haySolapamiento, obtenerDiaSemana, horaAMinutos } = require('../utils/date.utils');

const reservasService = {
  /**
   * Verificar si una mesa está disponible en un horario
   */
  async verificarDisponibilidadMesa(mesaId, fecha, horaInicio, duracionMinutos = 120) {
    const horaFin = calcularHoraFin(horaInicio, duracionMinutos);
    
    const { data: asignaciones, error } = await supabase
      .from('asignaciones_mesa')
      .select('id, hora_inicio, hora_fin')
      .eq('mesa_id', mesaId)
      .eq('fecha', fecha)
      .eq('estado', ESTADOS_ASIGNACION.OCUPADA);
    
    if (error) throw error;
    
    // Verificar solapamiento
    const haySolapamiento = asignaciones.some(a => {
      return (horaInicio >= a.hora_inicio && horaInicio < a.hora_fin) ||
             (horaFin > a.hora_inicio && horaFin <= a.hora_fin) ||
             (horaInicio <= a.hora_inicio && horaFin >= a.hora_fin);
    });
    
    return !haySolapamiento;
  },

  /**
   * Obtener parámetro de configuración
   */
  async obtenerParametro(clave) {
    const { data, error } = await supabase
      .from('parametros')
      .select('valor')
      .eq('clave', clave)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.valor;
  },

  /**
   * Verificar si se puede cancelar una reserva (por horas de anticipación)
   */
  async puedeCancelarConReembolso(reservaId) {
    // Obtener reserva
    const { data: reserva, error } = await supabase
      .from('reservas')
      .select('fecha, hora')
      .eq('id', reservaId)
      .single();
    
    if (error) throw error;
    
    // Obtener horas de anticipación requeridas
    const horasAnticipacion = await this.obtenerParametro('horas_anticipo_cancelacion') || 24;
    const devolverAnticipo = await this.obtenerParametro('devolver_anticipo_si_cancela') === 'true';
    
    if (!devolverAnticipo) return false;
    
    // Calcular diferencia en horas
    const horasRestantes = diferenciaHorasDesdeAhora(reserva.fecha, reserva.hora);
    
    return horasRestantes >= parseFloat(horasAnticipacion);
  },

  /**
   * Crear asignación de mesa para una reserva
   */
  async crearAsignacionMesa(reservaId, mesaId, fecha, horaInicio, duracionMinutos = 120) {
    const horaFin = calcularHoraFin(horaInicio, duracionMinutos);
    
    const { data, error } = await supabase
      .from('asignaciones_mesa')
      .insert({
        reserva_id: reservaId,
        mesa_id: mesaId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: ESTADOS_ASIGNACION.OCUPADA
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Obtener horario del restaurante para una fecha (según dia_semana: 0=Dom, 1=Lun, ... 6=Sab)
   */
  async getHorarioRestaurantePorFecha(fecha) {
    const diaSemana = obtenerDiaSemana(fecha);
    const { data, error } = await supabase
      .from('horarios_restaurante')
      .select('hora_apertura, hora_cierre, activo')
      .eq('dia_semana', diaSemana)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.activo === false) return null;
    return data;
  },

  /**
   * Validar que la reserva respete el horario del restaurante (día abierto, apertura, cierre y 1h30 antes del cierre)
   * y que sea al menos 2 horas después de la hora actual.
   * @returns { Promise<{ valido: boolean, error?: string }> }
   */
  async validarReservaNoAntesDelCierre(fecha, horaInicio, duracionMinutos = 120, margenMinutos = 90) {
    const horaNorm = (horaInicio || '').length === 5 ? `${horaInicio}:00` : horaInicio;
    const horasDesdeAhora = diferenciaHorasDesdeAhora(fecha, horaNorm);
    if (horasDesdeAhora < 2) {
      return { valido: false, error: 'La reserva debe ser al menos 2 horas después de la hora actual' };
    }

    const horario = await this.getHorarioRestaurantePorFecha(fecha);
    if (!horario) {
      return { valido: false, error: 'El restaurante está cerrado ese día' };
    }
    if (!horario.hora_apertura || !horario.hora_cierre) {
      return { valido: false, error: 'El restaurante no tiene horario definido para ese día' };
    }
    const aperturaMin = horaAMinutos(horario.hora_apertura);
    const cierreMin = horaAMinutos(horario.hora_cierre);
    const inicioMin = horaAMinutos(horaInicio);
    const finMin = inicioMin + (duracionMinutos || 120);

    if (inicioMin < aperturaMin) {
      const aperturaStr = (horario.hora_apertura || '').slice(0, 5);
      return { valido: false, error: `La reserva debe ser dentro del horario de apertura (desde ${aperturaStr})` };
    }
    if (finMin > cierreMin) {
      return { valido: false, error: 'La reserva terminaría después del cierre del restaurante' };
    }
    const ultimaHoraInicioPermitida = cierreMin - margenMinutos;
    if (inicioMin > ultimaHoraInicioPermitida) {
      return { valido: false, error: 'No se pueden hacer reservas a menos de 1h 30min del cierre del restaurante' };
    }
    return { valido: true };
  },

  /**
   * Obtener opciones de asignación: 1 mesa o varias combinables para N personas.
   * Si la hora no es válida por el cierre, devuelve { opciones: [], error }.
   */
  async getOpcionesAsignacion(fecha, hora, cantidadPersonas, duracionMinutos = 120) {
    const validacion = await this.validarReservaNoAntesDelCierre(fecha, hora, duracionMinutos);
    if (!validacion.valido) return { opciones: [], error: validacion.error };

    const horaFin = calcularHoraFin(hora, duracionMinutos);
    const N = Math.max(1, parseInt(cantidadPersonas, 10) || 1);

    const { data: mesas, error: errM } = await supabase
      .from('mesas')
      .select('id, numero_mesa, capacidad, combinable')
      .eq('activa', true)
      .order('numero_mesa');
    if (errM) throw errM;

    const { data: asignaciones } = await supabase
      .from('asignaciones_mesa')
      .select('mesa_id, hora_inicio, hora_fin')
      .eq('fecha', fecha)
      .eq('estado', ESTADOS_ASIGNACION.OCUPADA);

    const { data: reservasSlot } = await supabase
      .from('reservas')
      .select('id, mesa_id')
      .eq('fecha', fecha)
      .in('estado_id', [ESTADOS_RESERVA.PENDIENTE, ESTADOS_RESERVA.EN_GRACIA]);

    let mesasReservadasIds = new Set((reservasSlot || []).filter(r => r.mesa_id).map(r => r.mesa_id));
    try {
      const { data: reservaMesas } = await supabase
        .from('reserva_mesas')
        .select('mesa_id')
        .in('reserva_id', (reservasSlot || []).map(r => r.id));
      (reservaMesas || []).forEach(rm => mesasReservadasIds.add(rm.mesa_id));
    } catch (_) {
      // reserva_mesas puede no existir aún
    }

    const ocupadasEnSlot = new Set(
      (asignaciones || []).filter(a =>
        haySolapamiento(a.hora_inicio, a.hora_fin, hora, horaFin)
      ).map(a => a.mesa_id)
    );

    const disponibles = (mesas || []).filter(m => {
      if (ocupadasEnSlot.has(m.id)) return false;
      if (mesasReservadasIds.has(m.id)) return false;
      return true;
    });

    const opciones = [];
    const asMesa = (m) => ({ id: m.id, numero_mesa: m.numero_mesa, capacidad: m.capacidad ?? 0 });

    // Mesas simples que cubren N: solo las de menor capacidad que alcanza (mejor ajuste)
    const simplesQueFitan = disponibles
      .map(m => ({ m, cap: parseInt(m.capacidad, 10) || 0 }))
      .filter(({ cap }) => cap >= N);
    const minCapSimple = simplesQueFitan.length > 0
      ? Math.min(...simplesQueFitan.map(({ cap }) => cap))
      : null;
    if (minCapSimple != null) {
      for (const { m, cap } of simplesQueFitan) {
        if (cap === minCapSimple) {
          opciones.push({
            tipo: 'simple',
            mesas: [asMesa(m)],
            capacidad_total: cap,
            mesa_ids: [m.id],
          });
        }
      }
    }

    // Combinadas: solo si no hay ninguna mesa simple que alcance (N mayor que toda mesa individual)
    const combinables = disponibles.filter(m => m.combinable === true);
    const hayAlgunaSimpleQueFita = minCapSimple != null;

    function combinar(arr, k, inicio = 0, actual = [], resultado = []) {
      if (actual.length === k) {
        const total = actual.reduce((s, m) => s + (parseInt(m.capacidad, 10) || 0), 0);
        if (total >= N) resultado.push(actual.slice());
        return resultado;
      }
      for (let i = inicio; i < arr.length; i++) {
        actual.push(arr[i]);
        combinar(arr, k, i + 1, actual, resultado);
        actual.pop();
      }
      return resultado;
    }

    if (!hayAlgunaSimpleQueFita && combinables.length >= 2 && N > 1) {
      const todasCombinadas = [];
      for (let k = 2; k <= combinables.length; k++) {
        const grupos = combinar(combinables, k);
        for (const sub of grupos) {
          const total = sub.reduce((s, m) => s + (parseInt(m.capacidad, 10) || 0), 0);
          if (total >= N) todasCombinadas.push({ sub, total });
        }
      }
      const minTotal = todasCombinadas.length > 0
        ? Math.min(...todasCombinadas.map(({ total }) => total))
        : null;
      if (minTotal != null) {
        const yaVistos = new Set();
        for (const { sub, total } of todasCombinadas) {
          if (total !== minTotal) continue;
          const key = sub.map(m => m.id).sort().join(',');
          if (yaVistos.has(key)) continue;
          yaVistos.add(key);
          opciones.push({
            tipo: 'combinada',
            mesas: sub.map(asMesa),
            capacidad_total: total,
            mesa_ids: sub.map(m => m.id),
          });
        }
      }
    }

    if (opciones.length === 0 && disponibles.length > 0) {
      const maxSingle = Math.max(0, ...disponibles.map(m => parseInt(m.capacidad, 10) || 0));
      const combinables = disponibles.filter(m => m.combinable === true);
      const maxCombinada = combinables.length >= 2
        ? combinables.reduce((s, m) => s + (parseInt(m.capacidad, 10) || 0), 0)
        : 0;
      const maxCapacidad = Math.max(maxSingle, maxCombinada);
      if (maxCapacidad < N) {
        return { opciones: [], error: 'No hay mesas disponibles para esa cantidad de personas. Pruebe con menos personas o consulte al restaurante.' };
      }
    }

    return { opciones };
  },

  /**
   * Liberar asignación de mesa
   */
  async liberarAsignacionMesa(reservaId) {
    const { data, error } = await supabase
      .from('asignaciones_mesa')
      .update({ estado: ESTADOS_ASIGNACION.LIBERADA })
      .eq('reserva_id', reservaId)
      .select();
    
    if (error) throw error;
    return data;
  },

  /**
   * Otorgar puntos por reserva completada
   */
  async otorgarPuntosReserva(usuarioId, reservaId, puntos = 10) {
    const { data, error } = await supabase
      .from('puntos_usuario')
      .insert({
        usuario_id: usuarioId,
        puntos,
        tipo: 'reserva',
        referencia: `reserva_${reservaId}`
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Crear notificación para usuario
   */
  async crearNotificacion(usuarioId, reservaId, tipo, titulo, contenido) {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert({
        usuario_id: usuarioId,
        reserva_id: reservaId,
        tipo,
        titulo,
        contenido
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

module.exports = reservasService;
