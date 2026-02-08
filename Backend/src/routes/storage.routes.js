const { Router } = require('express');
const multer = require('multer');
const { verificarAuth, verificarRol } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');
const storageController = require('../controllers/storage.controller');

const router = Router();

// Configurar multer para almacenar en memoria (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  },
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo excede el tamaño máximo de 5 MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error al procesar archivo: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

// POST /api/storage/upload/:folder — Subir imagen (requiere autenticación)
router.post(
  '/upload/:folder',
  verificarAuth,
  upload.single('file'),
  handleMulterError,
  storageController.uploadImage
);

// DELETE /api/storage/:folder/:filename — Eliminar imagen (solo manager)
router.delete(
  '/:folder/:filename',
  verificarAuth,
  verificarRol(ROLES.MANAGER),
  storageController.deleteImage
);

module.exports = router;
