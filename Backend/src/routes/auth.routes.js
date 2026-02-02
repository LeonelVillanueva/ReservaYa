const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// POST /api/auth/register - Registro de usuario
router.post('/register', authController.register);

// POST /api/auth/login - Login
router.post('/login', authController.login);

// POST /api/auth/logout - Logout
router.post('/logout', authController.logout);

// GET /api/auth/me - Obtener usuario actual
router.get('/me', authController.getMe);

// POST /api/auth/verificar-email - Verificar correo con código de 6 caracteres (requiere token)
router.post('/verificar-email', authController.verificarEmail);

// POST /api/auth/reenviar-codigo - Reenviar código de verificación (requiere token)
router.post('/reenviar-codigo', authController.reenviarCodigo);

module.exports = router;
