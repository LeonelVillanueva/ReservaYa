const storageService = require('../services/storage.service');
const { success, error: errorResponse } = require('../utils/responses');

/**
 * POST /api/storage/upload/:folder
 * Sube una imagen al bucket de Supabase Storage.
 */
const uploadImage = async (req, res) => {
  try {
    const { folder } = req.params;

    if (!req.file) {
      return errorResponse(res, 'No se proporcionó ningún archivo', 400);
    }

    const result = await storageService.uploadFile(folder, req.file);

    return success(res, result, 'Imagen subida exitosamente', 201);
  } catch (err) {
    console.error('[storage.controller] Error al subir:', err.message);

    // Errores de validación del servicio
    if (
      err.message.includes('no permitida') ||
      err.message.includes('no permitido') ||
      err.message.includes('excede')
    ) {
      return errorResponse(res, err.message, 400);
    }

    return errorResponse(res, 'Error al subir la imagen', 500);
  }
};

/**
 * DELETE /api/storage/:folder/:filename
 * Elimina una imagen del bucket de Supabase Storage.
 */
const deleteImage = async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const filePath = `${folder}/${filename}`;

    // Validar que la carpeta sea permitida
    if (!storageService.CARPETAS_PERMITIDAS.includes(folder)) {
      return errorResponse(res, `Carpeta no permitida: ${folder}`, 400);
    }

    await storageService.deleteFile(filePath);

    return success(res, null, 'Imagen eliminada exitosamente');
  } catch (err) {
    console.error('[storage.controller] Error al eliminar:', err.message);
    return errorResponse(res, 'Error al eliminar la imagen', 500);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
