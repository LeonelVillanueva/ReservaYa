const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { verificarAuth, verificarRol } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');
const { validarId, validarCrearAlergia, validarActualizarAlergia } = require('../middlewares/validation.middleware');

router.use(verificarAuth);

// === CATEGORÍAS ===

// GET /api/menu/categorias - Listar categorías
router.get('/categorias', menuController.getCategorias);

// POST /api/menu/categorias - Crear categoría (solo manager)
router.post('/categorias', verificarRol(ROLES.MANAGER), menuController.createCategoria);

// PUT /api/menu/categorias/:id - Actualizar categoría (solo manager)
router.put('/categorias/:id', verificarRol(ROLES.MANAGER), menuController.updateCategoria);

// DELETE /api/menu/categorias/:id - Eliminar categoría (solo manager)
router.delete('/categorias/:id', verificarRol(ROLES.MANAGER), validarId, menuController.deleteCategoria);

// === PLATOS ===

// GET /api/menu/platos - Listar platos (query: categoria_id, disponible, page, limit)
router.get('/platos', menuController.getPlatos);

// GET /api/menu/platos/:id - Obtener plato con ingredientes
router.get('/platos/:id', menuController.getPlatoById);

// POST /api/menu/platos - Crear plato (solo manager)
router.post('/platos', verificarRol(ROLES.MANAGER), menuController.createPlato);

// PUT /api/menu/platos/:id - Actualizar plato (solo manager)
router.put('/platos/:id', verificarRol(ROLES.MANAGER), menuController.updatePlato);

// DELETE /api/menu/platos/:id - Eliminar plato (solo manager)
router.delete('/platos/:id', verificarRol(ROLES.MANAGER), validarId, menuController.deletePlato);

// PATCH /api/menu/platos/:id/disponibilidad - Cambiar disponibilidad (solo manager)
router.patch('/platos/:id/disponibilidad', verificarRol(ROLES.MANAGER), menuController.toggleDisponibilidad);

// === INGREDIENTES ===

// GET /api/menu/ingredientes - Listar ingredientes (incluye alergias asociadas)
router.get('/ingredientes', menuController.getIngredientes);

// POST /api/menu/ingredientes - Crear ingrediente (solo manager)
router.post('/ingredientes', verificarRol(ROLES.MANAGER), menuController.createIngrediente);

// PUT /api/menu/ingredientes/:id - Actualizar ingrediente (solo manager)
router.put('/ingredientes/:id', verificarRol(ROLES.MANAGER), validarId, menuController.updateIngrediente);

// DELETE /api/menu/ingredientes/:id - Eliminar ingrediente (solo manager)
router.delete('/ingredientes/:id', verificarRol(ROLES.MANAGER), validarId, menuController.deleteIngrediente);

// === ALERGIAS ===

// GET /api/menu/alergias - Listar alergias disponibles
router.get('/alergias', menuController.getAlergias);

// POST /api/menu/alergias - Crear alergia (solo manager)
router.post('/alergias', verificarRol(ROLES.MANAGER), validarCrearAlergia, menuController.createAlergia);

// PUT /api/menu/alergias/:id - Actualizar alergia (solo manager)
router.put('/alergias/:id', verificarRol(ROLES.MANAGER), validarActualizarAlergia, menuController.updateAlergia);

// DELETE /api/menu/alergias/:id - Eliminar alergia (solo manager)
router.delete('/alergias/:id', verificarRol(ROLES.MANAGER), validarId, menuController.deleteAlergia);

// GET /api/menu/platos-seguros/:usuario_id - Platos sin alérgenos del usuario
router.get('/platos-seguros/:usuario_id', menuController.getPlatosSeguros);

module.exports = router;
