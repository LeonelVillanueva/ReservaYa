const express = require('express');
const router = express.Router();
const parametrosController = require('../controllers/parametros.controller');
const { verificarAuth, verificarRol } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verificarAuth);

// GET /api/parametros - Listar todos los parámetros
router.get('/', parametrosController.getAll);

// === HORARIOS (antes de /:clave para que no se matchee "horarios" como clave) ===
// GET /api/parametros/horarios/restaurante - Obtener horarios
router.get('/horarios/restaurante', parametrosController.getHorarios);
// PUT /api/parametros/horarios/restaurante - Actualizar horarios (solo manager)
router.put('/horarios/restaurante', verificarRol(ROLES.MANAGER), parametrosController.updateHorarios);

// GET /api/parametros/:clave - Obtener un parámetro
router.get('/:clave', parametrosController.getByClave);

// PUT /api/parametros/:clave - Actualizar parámetro (solo manager)
router.put('/:clave', verificarRol(ROLES.MANAGER), parametrosController.update);

module.exports = router;
