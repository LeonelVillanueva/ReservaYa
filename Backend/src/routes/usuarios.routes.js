const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// GET /api/usuarios - Listar usuarios (manager)
router.get('/', usuariosController.getAll);

// GET /api/usuarios/:id - Obtener usuario
router.get('/:id', usuariosController.getById);

// GET /api/usuarios/:id/perfil - Obtener perfil del cliente
router.get('/:id/perfil', usuariosController.getPerfil);

// PUT /api/usuarios/:id/perfil - Actualizar perfil
router.put('/:id/perfil', usuariosController.updatePerfil);

// === ALERGIAS DEL USUARIO ===

// GET /api/usuarios/:id/alergias - Obtener alergias del usuario
router.get('/:id/alergias', usuariosController.getAlergias);

// POST /api/usuarios/:id/alergias - Registrar alergias
router.post('/:id/alergias', usuariosController.setAlergias);

// === PUNTOS / FIDELIZACIÓN ===

// GET /api/usuarios/:id/puntos - Obtener saldo de puntos
router.get('/:id/puntos', usuariosController.getPuntos);

// GET /api/usuarios/:id/historial-reservas - Historial de reservas
router.get('/:id/historial-reservas', usuariosController.getHistorialReservas);

module.exports = router;
