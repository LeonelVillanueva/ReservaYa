const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesas.controller');

// GET /api/mesas - Listar todas las mesas
router.get('/', mesasController.getAll);

// GET /api/mesas/disponibles - Mesas disponibles (query: fecha, hora, duracion, capacidad)
router.get('/disponibles', mesasController.getDisponibles);

// GET /api/mesas/:id - Obtener una mesa
router.get('/:id', mesasController.getById);

// POST /api/mesas - Crear mesa (manager)
router.post('/', mesasController.create);

// PUT /api/mesas/:id - Actualizar mesa (manager)
router.put('/:id', mesasController.update);

// DELETE /api/mesas/:id - Eliminar mesa (manager)
router.delete('/:id', mesasController.delete);

// GET /api/mesas/:id/asignaciones - Asignaciones de una mesa (query: fecha)
router.get('/:id/asignaciones', mesasController.getAsignaciones);

module.exports = router;
