const express = require('express');
const router = express.Router();
const multer = require('multer');
const pagosController = require('../controllers/pagos.controller');
const { verificarAuth, verificarRol } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

// Multer para recibir la imagen del comprobante (en memoria)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (permitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP)'), false);
    }
  },
});

router.use(verificarAuth);

// GET /api/pagos/pendientes-revision — Manager: lista pagos pendientes de revisión
router.get(
  '/pendientes-revision',
  verificarRol(ROLES.MANAGER),
  pagosController.getPendientesRevision
);

// GET /api/pagos/:id — Detalle de un pago
router.get('/:id', pagosController.getById);

// POST /api/pagos/:id/verificar-comprobante — Subir comprobante y verificar con OCR
router.post(
  '/:id/verificar-comprobante',
  upload.single('comprobante'),
  pagosController.verificarComprobanteTransferencia
);

// PATCH /api/pagos/:id/revision-manual — Manager aprueba/rechaza
router.patch(
  '/:id/revision-manual',
  verificarRol(ROLES.MANAGER),
  pagosController.revisionManual
);

module.exports = router;
