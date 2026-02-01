const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservas.controller');

// GET /api/reservas - Listar reservas (filtros: fecha, estado, usuario_id)
router.get('/', reservasController.getAll);

// GET /api/reservas/:id - Obtener una reserva
router.get('/:id', reservasController.getById);

// POST /api/reservas - Crear reserva con anticipo
router.post('/', reservasController.create);

// PUT /api/reservas/:id - Actualizar reserva
router.put('/:id', reservasController.update);

// PATCH /api/reservas/:id/cancelar - Cancelar reserva
router.patch('/:id/cancelar', reservasController.cancelar);

// PATCH /api/reservas/:id/confirmar - Confirmar reserva (cliente llegó)
router.patch('/:id/confirmar', reservasController.confirmar);

// PATCH /api/reservas/:id/no-show - Marcar como no-show
router.patch('/:id/no-show', reservasController.marcarNoShow);

// PATCH /api/reservas/:id/completar - Completar reserva (con cuenta final)
router.patch('/:id/completar', reservasController.completar);

module.exports = router;
