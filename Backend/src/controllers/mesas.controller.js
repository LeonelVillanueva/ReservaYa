const { supabase } = require('../config/supabase');
const reservasService = require('../services/reservas.service');
const { success, created, error: sendError, notFound } = require('../utils/responses');

const mesasController = {
  // GET /api/mesas
  async getAll(req, res) {
    try {
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .order('numero_mesa');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // GET /api/mesas/con-estado — mesas con estado (disponible, ocupado, reservado) para una fecha
  async getConEstado(req, res) {
    try {
      const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

      const [mesasRes, asignacionesRes, reservasRes] = await Promise.all([
        supabase.from('mesas').select('*').order('numero_mesa'),
        supabase.from('asignaciones_mesa').select('mesa_id').eq('fecha', fecha).eq('estado', 'ocupada'),
        supabase.from('reservas').select('id, mesa_id, estado_id').eq('fecha', fecha).in('estado_id', [1, 2, 6]),
      ]);

      const { data: mesas, error: errMesas } = mesasRes;
      if (errMesas) throw errMesas;

      const asignaciones = asignacionesRes.data || [];
      const reservas = reservasRes.data || [];
      const mesasOcupadas = new Set(asignaciones.map(a => a.mesa_id));
      const mesasReservadas = new Set(
        reservas.filter(r => r.mesa_id && !mesasOcupadas.has(r.mesa_id)).map(r => r.mesa_id)
      );
      try {
        const reservaIds = reservas.map(r => r.id);
        if (reservaIds.length > 0) {
          const { data: rm } = await supabase.from('reserva_mesas').select('mesa_id').in('reserva_id', reservaIds);
          (rm || []).forEach(row => mesasReservadas.add(row.mesa_id));
        }
      } catch (_) {}

      const result = (mesas || [])
        .filter(m => m?.activa !== false)
        .map(m => {
          let estado = 'disponible';
          if (mesasOcupadas.has(m.id)) estado = 'ocupado';
          else if (mesasReservadas.has(m.id)) estado = 'reservado';
          return { ...m, estado };
        });

      res.json(result);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // GET /api/mesas/opciones-asignacion - Opciones: 1 mesa o combinación para N personas
  async getOpcionesAsignacion(req, res) {
    try {
      const { fecha, hora, cantidad_personas, duracion = 120 } = req.query;
      if (!fecha || !hora) {
        return sendError(res, 'Se requiere fecha y hora', 400);
      }
      const horaNorm = hora.length === 5 ? `${hora}:00` : hora;
      const resultado = await reservasService.getOpcionesAsignacion(
        fecha,
        horaNorm,
        cantidad_personas || 1,
        parseInt(duracion, 10) || 120
      );
      res.json(resultado);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // GET /api/mesas/disponibles
  async getDisponibles(req, res) {
    try {
      const { fecha, hora, duracion = 120, capacidad_minima } = req.query;
      
      if (!fecha || !hora) {
        return sendError(res, 'Se requiere fecha y hora', 400);
      }
      
      // Obtener todas las mesas activas
      let query = supabase
        .from('mesas')
        .select('*')
        .eq('activa', true);
      
      if (capacidad_minima) {
        query = query.gte('capacidad', parseInt(capacidad_minima));
      }
      
      const { data: mesas, error: errMesas } = await query;
      if (errMesas) throw errMesas;
      
      // Obtener asignaciones del día
      const { data: asignaciones, error: errAsig } = await supabase
        .from('asignaciones_mesa')
        .select('mesa_id, hora_inicio, hora_fin')
        .eq('fecha', fecha)
        .eq('estado', 'ocupada');
      
      if (errAsig) throw errAsig;
      
      // Filtrar mesas disponibles (sin solapamiento)
      const horaInicio = hora;
      const [h, m] = hora.split(':').map(Number);
      const minutosFin = h * 60 + m + parseInt(duracion);
      const horaFin = `${Math.floor(minutosFin / 60).toString().padStart(2, '0')}:${(minutosFin % 60).toString().padStart(2, '0')}:00`;
      
      const mesasDisponibles = mesas.filter(mesa => {
        const asignacionesMesa = asignaciones.filter(a => a.mesa_id === mesa.id);
        return !asignacionesMesa.some(a => {
          return (horaInicio >= a.hora_inicio && horaInicio < a.hora_fin) ||
                 (horaFin > a.hora_inicio && horaFin <= a.hora_fin) ||
                 (horaInicio <= a.hora_inicio && horaFin >= a.hora_fin);
        });
      });
      
      res.json(mesasDisponibles);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // GET /api/mesas/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('mesas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return notFound(res, 'Mesa no encontrada');
      
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // POST /api/mesas
  async create(req, res) {
    try {
      const { numero_mesa, capacidad, posicion_x, posicion_y, activa = true, combinable = false } = req.body;
      
      const { data, error } = await supabase
        .from('mesas')
        .insert({ numero_mesa, capacidad, posicion_x, posicion_y, activa, combinable })
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // PUT /api/mesas/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { numero_mesa, capacidad, posicion_x, posicion_y, activa, combinable } = req.body;
      
      const { data, error } = await supabase
        .from('mesas')
        .update({ numero_mesa, capacidad, posicion_x, posicion_y, activa, combinable })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // DELETE /api/mesas/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ message: 'Mesa eliminada' });
    } catch (error) {
      sendError(res, error.message);
    }
  },

  // GET /api/mesas/:id/asignaciones
  async getAsignaciones(req, res) {
    try {
      const { id } = req.params;
      const { fecha } = req.query;
      
      let query = supabase
        .from('asignaciones_mesa')
        .select(`
          *,
          reserva:reservas(id, usuario_id, cantidad_personas)
        `)
        .eq('mesa_id', id);
      
      if (fecha) query = query.eq('fecha', fecha);
      
      const { data, error } = await query.order('hora_inicio');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
    }
  }
};

module.exports = mesasController;
