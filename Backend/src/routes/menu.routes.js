const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');

// === CATEGORÍAS ===

// GET /api/menu/categorias - Listar categorías
router.get('/categorias', menuController.getCategorias);

// POST /api/menu/categorias - Crear categoría (manager)
router.post('/categorias', menuController.createCategoria);

// PUT /api/menu/categorias/:id - Actualizar categoría (manager)
router.put('/categorias/:id', menuController.updateCategoria);

// === PLATOS ===

// GET /api/menu/platos - Listar platos (query: categoria_id, disponible)
router.get('/platos', menuController.getPlatos);

// GET /api/menu/platos/:id - Obtener plato con ingredientes
router.get('/platos/:id', menuController.getPlatoById);

// POST /api/menu/platos - Crear plato (manager)
router.post('/platos', menuController.createPlato);

// PUT /api/menu/platos/:id - Actualizar plato (manager)
router.put('/platos/:id', menuController.updatePlato);

// PATCH /api/menu/platos/:id/disponibilidad - Cambiar disponibilidad
router.patch('/platos/:id/disponibilidad', menuController.toggleDisponibilidad);

// === INGREDIENTES ===

// GET /api/menu/ingredientes - Listar ingredientes
router.get('/ingredientes', menuController.getIngredientes);

// POST /api/menu/ingredientes - Crear ingrediente (manager)
router.post('/ingredientes', menuController.createIngrediente);

// === ALERGIAS (para filtrar menú) ===

// GET /api/menu/alergias - Listar alergias disponibles
router.get('/alergias', menuController.getAlergias);

// GET /api/menu/platos-seguros/:usuario_id - Platos sin alérgenos del usuario
router.get('/platos-seguros/:usuario_id', menuController.getPlatosSeguros);

module.exports = router;
