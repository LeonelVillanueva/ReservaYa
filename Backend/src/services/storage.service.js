const { supabaseAdmin } = require('../config/supabase');

const BUCKET = 'IMG_REST';

const CARPETAS_PERMITIDAS = ['platos', 'perfiles', 'restaurante'];

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Sube un archivo al bucket de Supabase Storage.
 * @param {string} folder - Carpeta destino (platos, perfiles, restaurante)
 * @param {Object} file - Objeto de archivo de multer (buffer, originalname, mimetype)
 * @returns {{ url: string, path: string }} URL pública y ruta del archivo
 */
const uploadFile = async (folder, file) => {
  // Validar carpeta
  if (!CARPETAS_PERMITIDAS.includes(folder)) {
    throw new Error(`Carpeta no permitida: ${folder}. Use: ${CARPETAS_PERMITIDAS.join(', ')}`);
  }

  // Validar tipo de archivo
  if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
    throw new Error(`Tipo de archivo no permitido: ${file.mimetype}. Use: ${TIPOS_PERMITIDOS.join(', ')}`);
  }

  // Validar tamaño
  if (file.size > MAX_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de ${MAX_SIZE / (1024 * 1024)} MB`);
  }

  // Generar nombre único: timestamp-nombreOriginal
  const timestamp = Date.now();
  const sanitizedName = file.originalname
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '_');
  const filePath = `${folder}/${timestamp}-${sanitizedName}`;

  // Subir a Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  // Obtener URL pública
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
};

/**
 * Elimina un archivo del bucket de Supabase Storage.
 * @param {string} filePath - Ruta completa del archivo (ej: platos/123-foto.jpg)
 */
const deleteFile = async (filePath) => {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
};

/**
 * Obtiene la URL pública de un archivo.
 * @param {string} filePath - Ruta del archivo dentro del bucket
 * @returns {string} URL pública
 */
const getPublicUrl = (filePath) => {
  const { data } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

module.exports = {
  uploadFile,
  deleteFile,
  getPublicUrl,
  CARPETAS_PERMITIDAS,
  TIPOS_PERMITIDOS,
  MAX_SIZE,
};
