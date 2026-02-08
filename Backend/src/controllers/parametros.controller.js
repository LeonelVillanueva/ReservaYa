const { supabase } = require('../config/supabase');

const parametrosController = {
  // GET /api/parametros
  async getAll(req, res) {
    try {
      const { data, error } = await supabase
        .from('parametros')
        .select('*')
        .order('clave');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/parametros/:clave
  async getByClave(req, res) {
    try {
      const { clave } = req.params;
      
      const { data, error } = await supabase
        .from('parametros')
        .select('*')
        .eq('clave', clave)
        .single();
      
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Parámetro no encontrado' });
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/parametros/:clave
  async update(req, res) {
    try {
      const { clave } = req.params;
      const { valor } = req.body;
      
      // Upsert: crea el parámetro si no existe, lo actualiza si ya existe
      const { data, error } = await supabase
        .from('parametros')
        .upsert({ clave, valor }, { onConflict: 'clave' })
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/parametros/horarios/restaurante
  async getHorarios(req, res) {
    try {
      const { data, error } = await supabase
        .from('horarios_restaurante')
        .select('*')
        .order('dia_semana');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/parametros/horarios/restaurante
  async updateHorarios(req, res) {
    try {
      const { horarios } = req.body; // Array de { dia_semana, hora_apertura, hora_cierre, activo }
      
      if (!horarios || !Array.isArray(horarios)) {
        return res.status(400).json({ error: 'Se requiere array de horarios' });
      }
      
      // Actualizar cada horario
      for (const h of horarios) {
        const { error } = await supabase
          .from('horarios_restaurante')
          .upsert({
            dia_semana: h.dia_semana,
            hora_apertura: h.hora_apertura,
            hora_cierre: h.hora_cierre,
            activo: h.activo
          }, { onConflict: 'dia_semana' });
        
        if (error) throw error;
      }
      
      // Devolver horarios actualizados
      const { data, error } = await supabase
        .from('horarios_restaurante')
        .select('*')
        .order('dia_semana');
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = parametrosController;
