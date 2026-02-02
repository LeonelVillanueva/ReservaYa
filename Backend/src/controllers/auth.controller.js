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

  // POST /api/auth/login — valida contra tabla usuarios (pruebas: contraseña en texto plano)
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
      }
      
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, rol_id, activo')
        .eq('email', email.trim().toLowerCase())
        .eq('password_hash', password)
        .eq('activo', true)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }
      
      // Token simple para pruebas (en producción usar JWT o Supabase Auth)
      const token = `token-${user.id}-${Date.now()}`;
      
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol_id: user.rol_id
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/auth/logout
  async logout(req, res) {
    try {
      res.json({ success: true, message: 'Sesión cerrada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/auth/me — valida token de prueba (token-{userId}-{timestamp}) y devuelve usuario
  async getMe(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado' });
      }

      const token = authHeader.split(' ')[1];
      // Token de prueba: "token-{userId}-{timestamp}"
      if (!token.startsWith('token-')) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
      }

      const parts = token.split('-');
      const userId = parseInt(parts[1], 10);
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ success: false, error: 'Token inválido' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, rol_id, activo')
        .eq('id', userId)
        .eq('activo', true)
        .single();

      if (error || !user) {
        return res.status(401).json({ success: false, error: 'Usuario no encontrado o inactivo' });
      }

      res.json({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol_id: user.rol_id
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = authController;
