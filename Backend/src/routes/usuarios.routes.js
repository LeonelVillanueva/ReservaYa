const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { verificarAuth, verificarRol, verificarPropietarioOManager } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verificarAuth);

// GET /api/usuarios - Listar usuarios (solo manager)
router.get('/', verificarRol(ROLES.MANAGER), usuariosController.getAll);

// GET /api/usuarios/:id - Obtener usuario (propietario o manager)
router.get('/:id', verificarPropietarioOManager('id'), usuariosController.getById);

// GET /api/usuarios/:id/perfil - Obtener perfil del cliente
router.get('/:id/perfil', verificarPropietarioOManager('id'), usuariosController.getPerfil);

// PUT /api/usuarios/:id/perfil - Actualizar perfil (solo propietario o manager)
router.put('/:id/perfil', verificarPropietarioOManager('id'), usuariosController.updatePerfil);

// === ALERGIAS DEL USUARIO ===

// GET /api/usuarios/:id/alergias - Obtener alergias (propietario o manager)
router.get('/:id/alergias', verificarPropietarioOManager('id'), usuariosController.getAlergias);

// POST /api/usuarios/:id/alergias - Registrar alergias (propietario o manager)
router.post('/:id/alergias', verificarPropietarioOManager('id'), usuariosController.setAlergias);

// === PUNTOS / FIDELIZACIÓN ===

// GET /api/usuarios/:id/puntos - Obtener saldo de puntos (propietario o manager)
router.get('/:id/puntos', verificarPropietarioOManager('id'), usuariosController.getPuntos);

// GET /api/usuarios/:id/historial-reservas - Historial de reservas (propietario o manager)
router.get('/:id/historial-reservas', verificarPropietarioOManager('id'), usuariosController.getHistorialReservas);

module.exports = router;
