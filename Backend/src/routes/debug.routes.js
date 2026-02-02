const express = require('express');
const router = express.Router();

const { emailService } = require('../services');

// POST /api/debug/enviar-correo
router.post('/enviar-correo', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, error: 'Falta el destinatario (to)' });
    }

    const info = await emailService.enviarCorreoPrueba(to);

    res.json({
      success: true,
      message: 'Correo de prueba enviado',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[debug.routes] Error al enviar correo de prueba:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

