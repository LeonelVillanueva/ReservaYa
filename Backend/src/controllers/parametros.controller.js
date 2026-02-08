const { supabase } = require('../config/supabase');
const { error: sendError, notFound } = require('../utils/responses');

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
      sendError(res, error.message);
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
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return notFound(res, 'Parámetro no encontrado');
      
      res.json(data);
    } catch (error) {
      sendError(res, error.message);
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
      sendError(res, error.message);
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
      sendError(res, error.message);
    }
  },

  // PUT /api/parametros/horarios/restaurante
  async updateHorarios(req, res) {
    try {
      const { horarios } = req.body; // Array de { dia_semana, hora_apertura, hora_cierre, activo }
      
      if (!horarios || !Array.isArray(horarios)) {
        return sendError(res, 'Se requiere array de horarios', 400);
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
      sendError(res, error.message);
    }
  }
};

module.exports = parametrosController;
