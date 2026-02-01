const { supabase } = require('../config/supabase');
const { ROLES } = require('../utils/constants');

/**
 * Middleware para verificar autenticación
 * En desarrollo: pasa sin verificar si no hay token
 * En producción: requiere token válido
 */
const verificarAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Si no hay header de autorización
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // En desarrollo, permitir continuar sin autenticación
      if (process.env.NODE_ENV === 'development') {
        req.user = null;
        return next();
      }
      return res.status(401).json({ 
        success: false, 
        error: 'Token no proporcionado' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      });
    }
    
    // Obtener datos adicionales del usuario desde nuestra tabla
    const { data: usuarioData, error: errUsuario } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol_id, activo')
      .eq('email', user.email)
      .single();
    
    if (errUsuario || !usuarioData) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no encontrado en el sistema' 
      });
    }
    
    if (!usuarioData.activo) {
      return res.status(403).json({ 
        success: false, 
        error: 'Usuario desactivado' 
      });
    }
    
    // Adjuntar usuario al request
    req.user = {
      ...usuarioData,
      authUser: user
    };
    
    next();
  } catch (error) {
    console.error('Error en verificarAuth:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Error de autenticación' 
    });
  }
};

/**
 * Middleware para verificar rol del usuario
 * Uso: verificarRol(ROLES.MANAGER) o verificarRol(ROLES.MANAGER, ROLES.AGENTE_IA)
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Si no hay usuario (desarrollo sin auth)
    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        return next();
      }
      return res.status(401).json({ 
        success: false, 
        error: 'Autenticación requerida' 
      });
    }
    
    // Verificar si el rol del usuario está en los permitidos
    if (!rolesPermitidos.includes(req.user.rol_id)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tiene permisos para esta acción' 
      });
    }
    
    next();
  };
};

/**
 * Middleware para rutas que solo el propio usuario o manager pueden acceder
 */
const verificarPropietarioOManager = (paramId = 'id') => {
  return (req, res, next) => {
    // Si no hay usuario (desarrollo)
    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        return next();
      }
      return res.status(401).json({ 
        success: false, 
        error: 'Autenticación requerida' 
      });
    }
    
    const recursoId = parseInt(req.params[paramId]);
    const esManager = req.user.rol_id === ROLES.MANAGER;
    const esPropietario = req.user.id === recursoId;
    
    if (!esManager && !esPropietario) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tiene permisos para acceder a este recurso' 
      });
    }
    
    next();
  };
};

/**
 * Middleware opcional: solo verifica si hay token, no bloquea si no hay
 */
const authOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, rol_id, activo')
        .eq('email', user.email)
        .single();
      
      req.user = usuarioData ? { ...usuarioData, authUser: user } : null;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { 
  verificarAuth, 
  verificarRol, 
  verificarPropietarioOManager,
  authOpcional
};
