/**
 * Utilidades para respuestas estandarizadas de la API
 */

// Respuesta exitosa
const success = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true
  };
  
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  
  return res.status(statusCode).json(response);
};

// Respuesta de creación exitosa
const created = (res, data, message = 'Recurso creado exitosamente') => {
  return success(res, data, message, 201);
};

// Respuesta de error
const error = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message
  };
  
  if (details) response.details = details;
  
  return res.status(statusCode).json(response);
};

// Respuesta de error de validación
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Error de validación',
    details: errors
  });
};

// Respuesta de no encontrado
const notFound = (res, message = 'Recurso no encontrado') => {
  return error(res, message, 404);
};

// Respuesta de no autorizado
const unauthorized = (res, message = 'No autorizado') => {
  return error(res, message, 401);
};

// Respuesta de acceso denegado
const forbidden = (res, message = 'Acceso denegado') => {
  return error(res, message, 403);
};

// Respuesta de conflicto (ej: registro duplicado)
const conflict = (res, message = 'Conflicto con el recurso existente') => {
  return error(res, message, 409);
};

// Respuesta paginada
const paginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
};

module.exports = {
  success,
  created,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  paginated
};
