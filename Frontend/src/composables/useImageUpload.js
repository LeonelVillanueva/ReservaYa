import { ref } from 'vue'
import { storageApi } from '@/api'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Composable para subir imágenes al bucket de Supabase Storage.
 *
 * Uso:
 * ```js
 * const { preview, uploading, error, uploadImage, reset } = useImageUpload()
 *
 * // En un input file:
 * async function onFileChange(event) {
 *   const file = event.target.files[0]
 *   const url = await uploadImage('platos', file)
 *   if (url) console.log('Subida exitosa:', url)
 * }
 * ```
 */
export function useImageUpload() {
  const preview = ref(null)
  const uploading = ref(false)
  const error = ref(null)
  const uploadedUrl = ref(null)

  /**
   * Valida un archivo antes de subirlo.
   * @param {File} file
   * @returns {string|null} Mensaje de error o null si es válido
   */
  function validate(file) {
    if (!file) return 'No se seleccionó ningún archivo'
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return `Tipo no permitido: ${file.type}. Use JPG, PNG, WebP o GIF.`
    }
    if (file.size > MAX_SIZE) {
      return `El archivo excede los ${MAX_SIZE / (1024 * 1024)} MB permitidos.`
    }
    return null
  }

  /**
   * Genera una previsualización local del archivo.
   * @param {File} file
   */
  function setPreview(file) {
    // Liberar URL anterior si existe
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
    }
    preview.value = file ? URL.createObjectURL(file) : null
  }

  /**
   * Sube una imagen al servidor.
   * @param {'platos'|'perfiles'|'restaurante'} folder - Carpeta destino
   * @param {File} file - Archivo a subir
   * @returns {string|null} URL pública de la imagen o null si falló
   */
  async function uploadImage(folder, file) {
    error.value = null
    uploadedUrl.value = null

    // Validar
    const validationError = validate(file)
    if (validationError) {
      error.value = validationError
      return null
    }

    // Previsualización
    setPreview(file)

    // Subir
    uploading.value = true
    try {
      const response = await storageApi.upload(folder, file)
      uploadedUrl.value = response.data.url
      return response.data.url
    } catch (err) {
      error.value = err?.error || err?.message || 'Error al subir la imagen'
      return null
    } finally {
      uploading.value = false
    }
  }

  /**
   * Resetea el estado del composable.
   */
  function reset() {
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
    }
    preview.value = null
    uploading.value = false
    error.value = null
    uploadedUrl.value = null
  }

  return {
    preview,
    uploading,
    error,
    uploadedUrl,
    uploadImage,
    setPreview,
    validate,
    reset,
  }
}
