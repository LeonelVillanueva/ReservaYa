/**
 * Middleware de validación con express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

// Procesar resultados de validación
const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: errors.array().map(e => ({
        campo: e.path,
        mensaje: e.msg
      }))
    });
  }
  next();
};

// === VALIDACIONES PARA RESERVAS ===

const validarCrearReserva = [
  body('usuario_id').isInt({ min: 1 }).withMessage('usuario_id debe ser un número entero positivo'),
  body('creado_por_id').isInt({ min: 1 }).withMessage('creado_por_id debe ser un número entero positivo'),
  body('fecha').isDate().withMessage('fecha debe tener formato YYYY-MM-DD'),
  body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora debe tener formato HH:MM o HH:MM:SS'),
  body('cantidad_personas').isInt({ min: 1, max: 50 }).withMessage('cantidad_personas debe ser entre 1 y 50'),
  body('monto_anticipo').isDecimal({ decimal_digits: '0,2' }).withMessage('monto_anticipo debe ser un número válido'),
  body('metodo_pago_id').isInt({ min: 1 }).withMessage('metodo_pago_id debe ser un número entero positivo'),
  body('mesa_id').optional().isInt({ min: 1 }).withMessage('mesa_id debe ser un número entero positivo'),
  body('duracion_estimada_minutos').optional().isInt({ min: 30, max: 480 }).withMessage('duración debe ser entre 30 y 480 minutos'),
  body('notas').optional().isString().isLength({ max: 500 }).withMessage('notas máximo 500 caracteres'),
  validar
];

const validarActualizarReserva = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('fecha').optional().isDate().withMessage('fecha debe tener formato YYYY-MM-DD'),
  body('hora').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora inválida'),
  body('cantidad_personas').optional().isInt({ min: 1, max: 50 }).withMessage('cantidad_personas debe ser entre 1 y 50'),
  validar
];

// === VALIDACIONES PARA MESAS ===

const validarCrearMesa = [
  body('numero_mesa').notEmpty().isLength({ max: 20 }).withMessage('numero_mesa requerido, máximo 20 caracteres'),
  body('capacidad').isInt({ min: 1, max: 20 }).withMessage('capacidad debe ser entre 1 y 20'),
  body('posicion_x').optional().isDecimal().withMessage('posicion_x debe ser un número'),
  body('posicion_y').optional().isDecimal().withMessage('posicion_y debe ser un número'),
  body('activa').optional().isBoolean().withMessage('activa debe ser true o false'),
  validar
];

const validarMesasDisponibles = [
  query('fecha').isDate().withMessage('fecha requerida en formato YYYY-MM-DD'),
  query('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('hora requerida en formato HH:MM'),
  query('duracion').optional().isInt({ min: 30, max: 480 }).withMessage('duración debe ser entre 30 y 480 minutos'),
  query('capacidad_minima').optional().isInt({ min: 1 }).withMessage('capacidad_minima debe ser un número positivo'),
  validar
];

// === VALIDACIONES PARA MENÚ ===

const validarCrearPlato = [
  body('categoria_id').isInt({ min: 1 }).withMessage('categoria_id requerido'),
  body('nombre').notEmpty().isLength({ max: 200 }).withMessage('nombre requerido, máximo 200 caracteres'),
  body('precio').isDecimal({ decimal_digits: '0,2' }).withMessage('precio debe ser un número válido'),
  body('descripcion').optional().isString().withMessage('descripcion debe ser texto'),
  body('disponible').optional().isBoolean().withMessage('disponible debe ser true o false'),
  body('imagen_url').optional().isURL().withMessage('imagen_url debe ser una URL válida'),
  validar
];

const validarCrearCategoria = [
  body('nombre').notEmpty().isLength({ max: 100 }).withMessage('nombre requerido, máximo 100 caracteres'),
  body('descripcion').optional().isString().withMessage('descripcion debe ser texto'),
  body('orden').optional().isInt({ min: 0 }).withMessage('orden debe ser un número positivo'),
  validar
];

// === VALIDACIONES PARA PEDIDOS ===

const validarCrearPedido = [
  body('mesa_id').isInt({ min: 1 }).withMessage('mesa_id requerido'),
  body('reserva_id').optional().isInt({ min: 1 }).withMessage('reserva_id debe ser un número'),
  body('items').optional().isArray().withMessage('items debe ser un array'),
  body('items.*.plato_id').optional().isInt({ min: 1 }).withMessage('plato_id inválido'),
  body('items.*.cantidad').optional().isInt({ min: 1 }).withMessage('cantidad debe ser al menos 1'),
  validar
];

const validarCambiarEstadoPedido = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('estado').isIn(['recibido', 'en_preparacion', 'servido']).withMessage('estado debe ser: recibido, en_preparacion o servido'),
  validar
];

// === VALIDACIONES PARA USUARIOS ===

const validarActualizarPerfil = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('fecha_nacimiento').optional().isDate().withMessage('fecha_nacimiento debe ser YYYY-MM-DD'),
  body('preferencias').optional().isString().isLength({ max: 1000 }).withMessage('preferencias máximo 1000 caracteres'),
  body('notas').optional().isString().isLength({ max: 1000 }).withMessage('notas máximo 1000 caracteres'),
  validar
];

const validarSetAlergias = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('alergias_ids').isArray().withMessage('alergias_ids debe ser un array'),
  body('alergias_ids.*').isInt({ min: 1 }).withMessage('Cada alergia_id debe ser un número'),
  validar
];

// === VALIDACIONES PARA PARÁMETROS ===

const validarActualizarParametro = [
  param('clave').notEmpty().isLength({ max: 100 }).withMessage('clave inválida'),
  body('valor').exists().withMessage('valor requerido'),
  validar
];

// === VALIDACIONES PARA ALERGIAS ===

const validarCrearAlergia = [
  body('nombre').notEmpty().isLength({ max: 100 }).withMessage('nombre requerido, máximo 100 caracteres'),
  validar
];

const validarActualizarAlergia = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('nombre').notEmpty().isLength({ max: 100 }).withMessage('nombre requerido, máximo 100 caracteres'),
  validar
];

// === VALIDACIONES PARA INGREDIENTES ===

const validarCrearIngrediente = [
  body('nombre').notEmpty().isLength({ max: 200 }).withMessage('nombre requerido, máximo 200 caracteres'),
  body('es_alergeno').optional().isBoolean().withMessage('es_alergeno debe ser true o false'),
  body('alergia_ids').optional().isArray().withMessage('alergia_ids debe ser un array'),
  body('alergia_ids.*').optional().isInt({ min: 1 }).withMessage('Cada alergia_id debe ser un número'),
  validar
];

const validarActualizarIngrediente = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('nombre').optional().notEmpty().isLength({ max: 200 }).withMessage('nombre máximo 200 caracteres'),
  body('es_alergeno').optional().isBoolean().withMessage('es_alergeno debe ser true o false'),
  body('alergia_ids').optional().isArray().withMessage('alergia_ids debe ser un array'),
  body('alergia_ids.*').optional().isInt({ min: 1 }).withMessage('Cada alergia_id debe ser un número'),
  validar
];

// === VALIDACIONES GENÉRICAS ===

const validarId = [
  param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo'),
  validar
];

module.exports = {
  validar,
  validarId,
  // Reservas
  validarCrearReserva,
  validarActualizarReserva,
  // Mesas
  validarCrearMesa,
  validarMesasDisponibles,
  // Menú
  validarCrearPlato,
  validarCrearCategoria,
  validarCrearIngrediente,
  validarActualizarIngrediente,
  // Alergias
  validarCrearAlergia,
  validarActualizarAlergia,
  // Pedidos
  validarCrearPedido,
  validarCambiarEstadoPedido,
  // Usuarios
  validarActualizarPerfil,
  validarSetAlergias,
  // Parámetros
  validarActualizarParametro
};
