const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const { verificarAuth } = require('../middlewares/auth.middleware');

router.use(verificarAuth);

// GET /api/pedidos - Listar pedidos (query: mesa_id, reserva_id, estado)
router.get('/', pedidosController.getAll);

// GET /api/pedidos/:id - Obtener pedido con detalle
router.get('/:id', pedidosController.getById);

// POST /api/pedidos - Crear pedido
router.post('/', pedidosController.create);

// POST /api/pedidos/:id/items - Agregar items al pedido
router.post('/:id/items', pedidosController.addItems);

// PATCH /api/pedidos/:id/estado - Cambiar estado (recibido, en_preparacion, servido)
router.patch('/:id/estado', pedidosController.cambiarEstado);

// GET /api/pedidos/:id/total - Obtener total del pedido
router.get('/:id/total', pedidosController.getTotal);

module.exports = router;
