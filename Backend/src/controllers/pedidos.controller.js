const { supabase } = require('../config/supabase');

const pedidosController = {
  // GET /api/pedidos
  async getAll(req, res) {
    try {
      const { mesa_id, reserva_id, estado } = req.query;
      
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          mesa:mesas(id, numero_mesa),
          reserva:reservas(id, usuario_id)
        `);
      
      if (mesa_id) query = query.eq('mesa_id', mesa_id);
      if (reserva_id) query = query.eq('reserva_id', reserva_id);
      if (estado) query = query.eq('estado', estado);
      
      const { data, error } = await query.order('creado_en', { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/pedidos/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener pedido
      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .select(`
          *,
          mesa:mesas(id, numero_mesa),
          reserva:reservas(id, usuario_id)
        `)
        .eq('id', id)
        .single();
      
      if (errPedido) throw errPedido;
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
      
      // Obtener detalle
      const { data: detalle, error: errDetalle } = await supabase
        .from('pedido_detalle')
        .select(`
          *,
          plato:platos(id, nombre, precio)
        `)
        .eq('pedido_id', id);
      
      if (errDetalle) throw errDetalle;
      
      res.json({ ...pedido, detalle });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/pedidos
  async create(req, res) {
    try {
      const { reserva_id, mesa_id, notas, items } = req.body;
      
      // 1. Crear pedido
      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          reserva_id,
          mesa_id,
          estado: 'recibido',
          notas
        })
        .select()
        .single();
      
      if (errPedido) throw errPedido;
      
      // 2. Agregar items si vienen
      if (items && items.length > 0) {
        // Obtener precios de platos
        const platosIds = items.map(i => i.plato_id);
        const { data: platos, error: errPlatos } = await supabase
          .from('platos')
          .select('id, precio')
          .in('id', platosIds);
        
        if (errPlatos) throw errPlatos;
        
        const preciosMap = Object.fromEntries(platos.map(p => [p.id, p.precio]));
        
        const detalles = items.map(item => ({
          pedido_id: pedido.id,
          plato_id: item.plato_id,
          cantidad: item.cantidad,
          observaciones: item.observaciones,
          precio_unitario: preciosMap[item.plato_id]
        }));
        
        const { error: errDetalle } = await supabase
          .from('pedido_detalle')
          .insert(detalles);
        
        if (errDetalle) throw errDetalle;
      }
      
      res.status(201).json(pedido);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/pedidos/:id/items
  async addItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Se requieren items' });
      }
      
      // Obtener precios
      const platosIds = items.map(i => i.plato_id);
      const { data: platos, error: errPlatos } = await supabase
        .from('platos')
        .select('id, precio')
        .in('id', platosIds);
      
      if (errPlatos) throw errPlatos;
      
      const preciosMap = Object.fromEntries(platos.map(p => [p.id, p.precio]));
      
      const detalles = items.map(item => ({
        pedido_id: parseInt(id),
        plato_id: item.plato_id,
        cantidad: item.cantidad,
        observaciones: item.observaciones,
        precio_unitario: preciosMap[item.plato_id]
      }));
      
      const { data, error } = await supabase
        .from('pedido_detalle')
        .insert(detalles)
        .select();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PATCH /api/pedidos/:id/estado
  async cambiarEstado(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      const estadosValidos = ['recibido', 'en_preparacion', 'servido'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }
      
      const { data, error } = await supabase
        .from('pedidos')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/pedidos/:id/total
  async getTotal(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('pedido_detalle')
        .select('cantidad, precio_unitario')
        .eq('pedido_id', id);
      
      if (error) throw error;
      
      const total = data.reduce((sum, item) => {
        return sum + (item.cantidad * (item.precio_unitario || 0));
      }, 0);
      
      res.json({ pedido_id: parseInt(id), total });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = pedidosController;
