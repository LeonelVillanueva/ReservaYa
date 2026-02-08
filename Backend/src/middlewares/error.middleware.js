/**
 * Middleware para manejo global de errores
 */
const { error: sendError, notFound, conflict } = require('../utils/responses');

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
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Errores de Supabase
  if (err.code) {
    // Error de constraint único
    if (err.code === '23505') {
      return conflict(res, 'El registro ya existe');
    }
    // Error de foreign key
    if (err.code === '23503') {
      return sendError(res, 'Referencia inválida', 400, err.details);
    }
    // Registro no encontrado
    if (err.code === 'PGRST116') {
      return notFound(res, 'Registro no encontrado');
    }
  }

  // Error genérico
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
  sendError(res, message);
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res) => {
  notFound(res, `Ruta no encontrada: ${req.originalUrl}`);
};

module.exports = { ApiError, errorHandler, notFoundHandler };
