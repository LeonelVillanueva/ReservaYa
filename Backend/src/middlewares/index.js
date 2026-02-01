/**
 * Exportación centralizada de middlewares
 */

const { 
  verificarAuth, 
  verificarRol, 
  verificarPropietarioOManager,
  authOpcional 
} = require('./auth.middleware');
const { ApiError, errorHandler, notFoundHandler } = require('./error.middleware');
const { requestLogger, devLogger } = require('./logger.middleware');
const validations = require('./validation.middleware');

module.exports = {
  // Auth
  verificarAuth,
  verificarRol,
  verificarPropietarioOManager,
  authOpcional,
  
  // Errores
  ApiError,
  errorHandler,
  notFoundHandler,
  
  // Logger
  requestLogger,
  devLogger,
  
  // Validaciones
  ...validations
};
