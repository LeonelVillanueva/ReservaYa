/**
 * Servicio de reservas - Lógica de negocio
 */

const { supabase } = require('../config/supabase');
const { ESTADOS_RESERVA, TIPOS_PAGO, ESTADOS_PAGO, ESTADOS_ASIGNACION } = require('../utils/constants');
const { calcularHoraFin, diferenciaHorasDesdeAhora } = require('../utils/date.utils');

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
