const { supabase } = require('../config/supabase');
const { ROLES } = require('../utils/constants');
const { resolveUserIdFromHeader } = require('../utils/token.utils');

/**
 * Middleware de autenticación unificado:
 * - Valida token firmado (sess.) o legacy (token-).
 * - Carga siempre el usuario desde la BD (rol_id, activo, etc.), no se confía en el cliente.
 * - En desarrollo sin token: opcionalmente permite continuar con req.user = null.
 */
const verificarAuth = async (req, res, next) => {
  try {
    const userId = resolveUserIdFromHeader(req.headers.authorization);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado o inválido',
      });
    }

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, username, rol_id, activo, email_verificado')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        success: false,
        error: 'Usuario desactivado',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[auth.middleware] Error:', err.message);
    res.status(401).json({
      success: false,
      error: 'Error de autenticación',
    });
  }
};

/**
 * Verifica que el usuario tenga uno de los roles permitidos.
 * Uso: verificarRol(ROLES.MANAGER) o verificarRol(ROLES.MANAGER, ROLES.AGENTE_IA)
 * Debe usarse después de verificarAuth.
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
      });
    }
    if (!rolesPermitidos.includes(req.user.rol_id)) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para esta acción',
      });
    }
    next();
  };
};

/**
 * Rutas que solo el propio usuario o un manager pueden acceder.
 */
const verificarPropietarioOManager = (paramId = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
      });
    }
    const recursoId = parseInt(req.params[paramId], 10);
    const esManager = req.user.rol_id === ROLES.MANAGER;
    const esPropietario = req.user.id === recursoId;
    if (!esManager && !esPropietario) {
      return res.status(403).json({
        success: false,
        error: 'No tiene permisos para acceder a este recurso',
      });
    }
    next();
  };
};

/**
 * Opcional: si hay token válido pone req.user; si no, req.user = null. No responde 401.
 */
const authOpcional = async (req, res, next) => {
  try {
    const userId = resolveUserIdFromHeader(req.headers.authorization);
    if (!userId) {
      req.user = null;
      return next();
    }
    const { data: user } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, username, rol_id, activo, email_verificado')
      .eq('id', userId)
      .eq('activo', true)
      .single();
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = {
  verificarAuth,
  verificarRol,
  verificarPropietarioOManager,
  authOpcional,
};
