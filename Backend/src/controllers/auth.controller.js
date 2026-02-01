const { supabase } = require('../config/supabase');

const authController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { email, password, nombre, apellido, telefono } = req.body;
      
      // TODO: Implementar registro con Supabase Auth o tabla usuarios
      res.status(501).json({ message: 'Por implementar: registro de usuario' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // TODO: Implementar login
      res.status(501).json({ message: 'Por implementar: login' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/auth/logout
  async logout(req, res) {
    try {
      // TODO: Implementar logout
      res.status(501).json({ message: 'Por implementar: logout' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/auth/me
  async getMe(req, res) {
    try {
      // TODO: Obtener usuario actual desde token/sesión
      res.status(501).json({ message: 'Por implementar: obtener usuario actual' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;
