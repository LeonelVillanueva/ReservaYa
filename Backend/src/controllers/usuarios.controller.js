const { supabase } = require('../config/supabase');

const usuariosController = {
  // GET /api/usuarios
  async getAll(req, res) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id, email, nombre, apellido, telefono, activo, creado_en,
          rol:roles(id, nombre)
        `)
        .order('nombre');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/usuarios/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id, email, nombre, apellido, telefono, activo, creado_en,
          rol:roles(id, nombre)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Usuario no encontrado' });
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/usuarios/:id/perfil
  async getPerfil(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('perfiles_cliente')
        .select('*')
        .eq('usuario_id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      res.json(data || { usuario_id: id, mensaje: 'Sin perfil aún' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/usuarios/:id/perfil
  async updatePerfil(req, res) {
    try {
      const { id } = req.params;
      const { fecha_nacimiento, preferencias, notas } = req.body;
      
      // Verificar si existe
      const { data: existente } = await supabase
        .from('perfiles_cliente')
        .select('id')
        .eq('usuario_id', id)
        .single();
      
      let data, error;
      
      if (existente) {
        // Actualizar
        ({ data, error } = await supabase
          .from('perfiles_cliente')
          .update({ fecha_nacimiento, preferencias, notas })
          .eq('usuario_id', id)
          .select()
          .single());
      } else {
        // Crear
        ({ data, error } = await supabase
          .from('perfiles_cliente')
          .insert({ usuario_id: id, fecha_nacimiento, preferencias, notas })
          .select()
          .single());
      }
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/usuarios/:id/alergias
  async getAlergias(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('usuario_alergia')
        .select(`
          alergia:alergias(id, nombre, descripcion)
        `)
        .eq('usuario_id', id);
      
      if (error) throw error;
      res.json(data.map(d => d.alergia));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/usuarios/:id/alergias
  async setAlergias(req, res) {
    try {
      const { id } = req.params;
      const { alergias_ids } = req.body; // Array de IDs de alergias
      
      // 1. Eliminar alergias actuales
      await supabase
        .from('usuario_alergia')
        .delete()
        .eq('usuario_id', id);
      
      // 2. Insertar nuevas
      if (alergias_ids && alergias_ids.length > 0) {
        const registros = alergias_ids.map(alergia_id => ({
          usuario_id: parseInt(id),
          alergia_id
        }));
        
        const { error } = await supabase
          .from('usuario_alergia')
          .insert(registros);
        
        if (error) throw error;
      }
      
      res.json({ message: 'Alergias actualizadas', alergias_ids });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/usuarios/:id/puntos
  async getPuntos(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('puntos_usuario')
        .select('puntos')
        .eq('usuario_id', id);
      
      if (error) throw error;
      
      const saldo = data.reduce((sum, p) => sum + p.puntos, 0);
      
      res.json({ usuario_id: parseInt(id), saldo_puntos: saldo });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/usuarios/:id/historial-reservas
  async getHistorialReservas(req, res) {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          estado:estados_reserva(id, nombre),
          mesa:mesas(id, numero_mesa)
        `)
        .eq('usuario_id', id)
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = usuariosController;
