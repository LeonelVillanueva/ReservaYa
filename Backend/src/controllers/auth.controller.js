const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');
const { ROLES } = require('../utils/constants');
const { emailService } = require('../services');

/** Genera un código alfanumérico de 6 caracteres */
function generarCodigoVerificacion() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

/** Genera base de username: nombre+apellido sin espacios ni acentos, en minúsculas */
function baseUsername(nombre, apellido) {
  const n = (nombre || '').trim();
  const a = (apellido || '').trim();
  const junto = `${n}${a}`.replace(/\s+/g, '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return junto.replace(/[^a-z0-9]/g, '') || 'user';
}

/** Genera un username único: base + número aleatorio (4-6 dígitos) */
async function generarUsernameUnico(nombre, apellido) {
  const base = baseUsername(nombre, apellido).slice(0, 60);
  const maxIntentos = 20;
  for (let i = 0; i < maxIntentos; i++) {
    const num = Math.floor(1000 + Math.random() * 900000);
    const username = `${base}${num}`;
    const { data: existente } = await supabase.from('usuarios').select('id').eq('username', username).maybeSingle();
    if (!existente) return username;
  }
  return `${base}${Date.now().toString().slice(-6)}`;
}

/** Parsea el token de prueba (token-{userId}-{timestamp}) y devuelve userId o null */
function parsearTokenCustom(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token?.startsWith('token-')) return null;
  const parts = token.split('-');
  const userId = parseInt(parts[1], 10);
  return !isNaN(userId) && userId > 0 ? userId : null;
}

const authController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { email, password, nombre, apellido, telefono } = req.body;

      if (!email || !password || !nombre) {
        return res.status(400).json({ success: false, error: 'Email, contraseña y nombre son obligatorios' });
      }

      const emailNormalizado = email.trim().toLowerCase();

      const { data: existente, error: errExiste } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', emailNormalizado)
        .maybeSingle();

      if (errExiste) throw errExiste;
      if (existente) {
        return res.status(409).json({ success: false, error: 'Ya existe una cuenta con este email' });
      }

      const username = await generarUsernameUnico(nombre, apellido);
      const password_hash = await bcrypt.hash(password, 10);
      const codigo = generarCodigoVerificacion();
      const codigo_verificacion_expira_en = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: user, error: errInsert } = await supabase
        .from('usuarios')
        .insert({
          email: emailNormalizado,
          password_hash,
          nombre: nombre.trim(),
          apellido: (apellido || '').trim(),
          telefono: telefono || null,
          rol_id: ROLES.CLIENTE,
          activo: true,
          username,
          email_verificado: false,
          codigo_verificacion: codigo,
          codigo_verificacion_expira_en,
        })
        .select('id, email, nombre, apellido, username, rol_id, email_verificado')
        .single();

      if (errInsert) throw errInsert;

      emailService.enviarCorreoVerificacion({
        to: user.email,
        nombre: user.nombre,
        codigo,
      }).catch((err) => console.error('[auth.register] Error al enviar correo de verificación:', err));

      const token = `token-${user.id}-${Date.now()}`;

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          username: user.username,
          rol_id: user.rol_id,
          email_verificado: user.email_verificado ?? false,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/auth/login — por username y contraseña; bloquea si email no verificado
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
      }

      const usuarioIngresado = (typeof username === 'string' ? username : '').trim();

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, username, rol_id, activo, password_hash, email_verificado')
        .eq('username', usuarioIngresado)
        .eq('activo', true)
        .single();

      if (error || !user) {
        return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }

      let coincide = false;
      const hash = user.password_hash || '';
      if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
        coincide = await bcrypt.compare(password, hash);
      } else if (process.env.NODE_ENV !== 'production') {
        coincide = hash === password;
      }
      if (!coincide) {
        return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }

      if (!user.email_verificado) {
        const token = `token-${user.id}-${Date.now()}`;
        return res.status(403).json({
          success: false,
          error: 'Debes verificar tu correo antes de iniciar sesión',
          code: 'EMAIL_NO_VERIFICADO',
          token,
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            username: user.username,
            rol_id: user.rol_id,
            email_verificado: false,
          },
        });
      }

      const token = `token-${user.id}-${Date.now()}`;
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          username: user.username,
          rol_id: user.rol_id,
          email_verificado: true,
        },
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
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/auth/me — token custom: token-{userId}-{timestamp}
  async getMe(req, res) {
    try {
      const userId = parsearTokenCustom(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado o inválido' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, username, rol_id, activo, email_verificado')
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
        username: user.username,
        rol_id: user.rol_id,
        email_verificado: user.email_verificado ?? false,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/auth/verificar-email — requiere token (usuario recién registrado o login sin verificar)
  async verificarEmail(req, res) {
    try {
      const userId = parsearTokenCustom(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado o inválido' });
      }

      const { codigo } = req.body;
      if (!codigo || typeof codigo !== 'string') {
        return res.status(400).json({ success: false, error: 'Código de verificación requerido' });
      }

      const codigoNormalizado = codigo.trim().toUpperCase();

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, codigo_verificacion, codigo_verificacion_expira_en, email_verificado')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      if (user.email_verificado) {
        return res.json({
          success: true,
          message: 'Correo ya verificado',
          user: await obtenerUsuarioParaRespuesta(user.id),
        });
      }

      if (user.codigo_verificacion !== codigoNormalizado) {
        return res.status(400).json({ success: false, error: 'Código de verificación incorrecto' });
      }

      const expira = user.codigo_verificacion_expira_en ? new Date(user.codigo_verificacion_expira_en) : null;
      if (expira && expira < new Date()) {
        return res.status(400).json({ success: false, error: 'El código ha expirado. Solicita uno nuevo.' });
      }

      const { error: errUpdate } = await supabase
        .from('usuarios')
        .update({
          email_verificado: true,
          codigo_verificacion: null,
          codigo_verificacion_expira_en: null,
        })
        .eq('id', userId);

      if (errUpdate) throw errUpdate;

      emailService.enviarCorreoBienvenida({
        to: user.email,
        nombre: user.nombre,
      }).catch((err) => console.error('[auth.verificarEmail] Error al enviar bienvenida:', err));

      const userResp = await obtenerUsuarioParaRespuesta(userId);
      res.json({
        success: true,
        message: 'Correo verificado correctamente',
        user: userResp,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/auth/reenviar-codigo — requiere token
  async reenviarCodigo(req, res) {
    try {
      const userId = parsearTokenCustom(req.headers.authorization);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Token no proporcionado o inválido' });
      }

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, email_verificado')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      if (user.email_verificado) {
        return res.json({ success: true, message: 'El correo ya está verificado' });
      }

      const codigo = generarCodigoVerificacion();
      const codigo_verificacion_expira_en = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: errUpdate } = await supabase
        .from('usuarios')
        .update({
          codigo_verificacion: codigo,
          codigo_verificacion_expira_en,
        })
        .eq('id', userId);

      if (errUpdate) throw errUpdate;

      await emailService.enviarCorreoVerificacion({
        to: user.email,
        nombre: user.nombre,
        codigo,
      });

      res.json({
        success: true,
        message: 'Se ha enviado un nuevo código a tu correo',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

async function obtenerUsuarioParaRespuesta(userId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id, email, nombre, apellido, username, rol_id, email_verificado')
    .eq('id', userId)
    .single();
  return data ? {
    ...data,
    email_verificado: data.email_verificado ?? true,
  } : null;
}

module.exports = authController;
