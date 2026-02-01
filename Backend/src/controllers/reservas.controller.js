const { supabase } = require('../config/supabase');

const reservasController = {
  // GET /api/reservas
  async getAll(req, res) {
    try {
      const { fecha, estado_id, usuario_id } = req.query;
      
      let query = supabase
        .from('reservas')
        .select(`
          *,
          usuario:usuarios!usuario_id(id, nombre, apellido, email),
          estado:estados_reserva(id, nombre),
          mesa:mesas(id, numero_mesa, capacidad)
        `);
      
      if (fecha) query = query.eq('fecha', fecha);
      if (estado_id) query = query.eq('estado_id', estado_id);
      if (usuario_id) query = query.eq('usuario_id', usuario_id);
      
      const { data, error } = await query.order('fecha', { ascending: true }).order('hora', { ascending: true });
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/reservas/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      
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
      if (!data) return res.status(404).json({ error: 'Reserva no encontrada' });
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/reservas
  async create(req, res) {
    try {
      const { 
        usuario_id, 
        creado_por_id, 
        mesa_id,
        fecha, 
        hora, 
        cantidad_personas,
        duracion_estimada_minutos,
        notas,
        monto_anticipo,
        metodo_pago_id
      } = req.body;
      
      // 1. Crear reserva (sin pago_anticipo_id)
      const { data: reserva, error: errReserva } = await supabase
        .from('reservas')
        .insert({
          usuario_id,
          creado_por_id,
          mesa_id,
          fecha,
          hora,
          cantidad_personas,
          duracion_estimada_minutos,
          estado_id: 1, // pendiente
          notas
        })
        .select()
        .single();
      
      if (errReserva) throw errReserva;
      
      // 2. Crear pago anticipo
      const { data: pago, error: errPago } = await supabase
        .from('pagos')
        .insert({
          reserva_id: reserva.id,
          tipo: 'anticipo',
          monto: monto_anticipo,
          metodo_pago_id,
          estado: 'completado',
          fecha_pago: new Date().toISOString()
        })
        .select()
        .single();
      
      if (errPago) throw errPago;
      
      // 3. Actualizar reserva con pago_anticipo_id
      const { data: reservaActualizada, error: errUpdate } = await supabase
        .from('reservas')
        .update({ pago_anticipo_id: pago.id, estado_id: 2 }) // confirmada
        .eq('id', reserva.id)
        .select()
        .single();
      
      if (errUpdate) throw errUpdate;
      
      res.status(201).json({ reserva: reservaActualizada, pago });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/reservas/:id
  async update(req, res) {
    try {
      const { id } = req.params;
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
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/reservas/:id/cancelar
  async cancelar(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: 3 }) // cancelada
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ message: 'Reserva cancelada', reserva: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/reservas/:id/confirmar
  async confirmar(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: 2 }) // confirmada
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ message: 'Reserva confirmada', reserva: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/reservas/:id/no-show
  async marcarNoShow(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('reservas')
        .update({ estado_id: 5 }) // no_show
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ message: 'Reserva marcada como no-show', reserva: data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/reservas/:id/completar
  async completar(req, res) {
    try {
      const { id } = req.params;
      const { monto_cobrado, anticipo_aplicado, metodo_pago_id } = req.body;
      
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
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reservasController;
