const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { verificarAuth, verificarRol } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verificarAuth);

// === CATEGORÍAS ===

// GET /api/menu/categorias - Listar categorías
router.get('/categorias', menuController.getCategorias);

// POST /api/menu/categorias - Crear categoría (solo manager)
router.post('/categorias', verificarRol(ROLES.MANAGER), menuController.createCategoria);

// PUT /api/menu/categorias/:id - Actualizar categoría (solo manager)
router.put('/categorias/:id', verificarRol(ROLES.MANAGER), menuController.updateCategoria);

// === PLATOS ===

// GET /api/menu/platos - Listar platos (query: categoria_id, disponible)
router.get('/platos', menuController.getPlatos);

// GET /api/menu/platos/:id - Obtener plato con ingredientes
router.get('/platos/:id', menuController.getPlatoById);

// POST /api/menu/platos - Crear plato (solo manager)
router.post('/platos', verificarRol(ROLES.MANAGER), menuController.createPlato);

// PUT /api/menu/platos/:id - Actualizar plato (solo manager)
router.put('/platos/:id', verificarRol(ROLES.MANAGER), menuController.updatePlato);

// PATCH /api/menu/platos/:id/disponibilidad - Cambiar disponibilidad (solo manager)
router.patch('/platos/:id/disponibilidad', verificarRol(ROLES.MANAGER), menuController.toggleDisponibilidad);

// === INGREDIENTES ===

// GET /api/menu/ingredientes - Listar ingredientes
router.get('/ingredientes', menuController.getIngredientes);

// POST /api/menu/ingredientes - Crear ingrediente (solo manager)
router.post('/ingredientes', verificarRol(ROLES.MANAGER), menuController.createIngrediente);

// === ALERGIAS (para filtrar menú) ===

// GET /api/menu/alergias - Listar alergias disponibles
router.get('/alergias', menuController.getAlergias);

// GET /api/menu/platos-seguros/:usuario_id - Platos sin alérgenos del usuario
router.get('/platos-seguros/:usuario_id', menuController.getPlatosSeguros);

module.exports = router;
