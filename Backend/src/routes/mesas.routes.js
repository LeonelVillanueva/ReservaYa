const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesas.controller');
const { verificarAuth, verificarRol } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verificarAuth);

// GET /api/mesas - Listar todas las mesas
router.get('/', mesasController.getAll);

// GET /api/mesas/con-estado - Mesas con estado (disponible/ocupado/reservado) para fecha (opcional)
router.get('/con-estado', mesasController.getConEstado);

// GET /api/mesas/opciones-asignacion - Opciones de asignación (1 mesa o combinada) para cantidad_personas
router.get('/opciones-asignacion', mesasController.getOpcionesAsignacion);

// GET /api/mesas/disponibles - Mesas disponibles (query: fecha, hora, duracion, capacidad)
router.get('/disponibles', mesasController.getDisponibles);

// GET /api/mesas/:id - Obtener una mesa
router.get('/:id', mesasController.getById);

// POST /api/mesas - Crear mesa (solo manager)
router.post('/', verificarRol(ROLES.MANAGER), mesasController.create);

// PUT /api/mesas/:id - Actualizar mesa (solo manager)
router.put('/:id', verificarRol(ROLES.MANAGER), mesasController.update);

// DELETE /api/mesas/:id - Eliminar mesa (solo manager)
router.delete('/:id', verificarRol(ROLES.MANAGER), mesasController.delete);

// GET /api/mesas/:id/asignaciones - Asignaciones de una mesa (query: fecha)
router.get('/:id/asignaciones', mesasController.getAsignaciones);

module.exports = router;
