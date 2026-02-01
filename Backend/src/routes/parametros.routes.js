const express = require('express');
const router = express.Router();
const parametrosController = require('../controllers/parametros.controller');

// GET /api/parametros - Listar todos los parámetros
router.get('/', parametrosController.getAll);

// GET /api/parametros/:clave - Obtener un parámetro
router.get('/:clave', parametrosController.getByClave);

// PUT /api/parametros/:clave - Actualizar parámetro (manager)
router.put('/:clave', parametrosController.update);

// === HORARIOS ===

// GET /api/parametros/horarios/restaurante - Obtener horarios
router.get('/horarios/restaurante', parametrosController.getHorarios);

// PUT /api/parametros/horarios/restaurante - Actualizar horarios (manager)
router.put('/horarios/restaurante', parametrosController.updateHorarios);

module.exports = router;
