/**
 * Middleware para manejo global de errores
 */

// Clase para errores personalizados de la API
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'No autorizado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Acceso denegado') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Error interno del servidor') {
    return new ApiError(500, message);
  }
}

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Si es un error de la API
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details
    });
  }

  // Errores de Supabase
  if (err.code) {
    // Error de constraint único
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'El registro ya existe',
        details: err.details
      });
    }
    // Error de foreign key
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Referencia inválida',
        details: err.details
      });
    }
    // Registro no encontrado
    if (err.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado'
      });
    }
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
};

module.exports = { ApiError, errorHandler, notFoundHandler };
