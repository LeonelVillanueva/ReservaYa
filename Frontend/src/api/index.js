import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest = error.config?.url?.includes?.('/auth/login')
    // Solo redirigir a login en 401 si NO es la petición de login (ej. token expirado en otra petición)
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// API modules
export const reservasApi = {
  getAll: (params) => api.get('/reservas', { params }),
  getById: (id) => api.get(`/reservas/${id}`),
  create: (data) => api.post('/reservas', data),
  update: (id, data) => api.put(`/reservas/${id}`, data),
  cancelar: (id) => api.patch(`/reservas/${id}/cancelar`),
  confirmar: (id) => api.patch(`/reservas/${id}/confirmar`),
  iniciarGracia: (id) => api.patch(`/reservas/${id}/iniciar-gracia`),
  expirarGracia: (id) => api.patch(`/reservas/${id}/expirar-gracia`),
  completar: (id, data) => api.patch(`/reservas/${id}/completar`, data),
}

export const mesasApi = {
  getAll: () => api.get('/mesas'),
  getConEstado: (params) => api.get('/mesas/con-estado', { params }),
  getOpcionesAsignacion: (params) => api.get('/mesas/opciones-asignacion', { params }),
  getDisponibles: (params) => api.get('/mesas/disponibles', { params }),
  getById: (id) => api.get(`/mesas/${id}`),
  create: (data) => api.post('/mesas', data),
  update: (id, data) => api.put(`/mesas/${id}`, data),
  delete: (id) => api.delete(`/mesas/${id}`),
}

export const menuApi = {
  // Categorías
  getCategorias: () => api.get('/menu/categorias'),
  createCategoria: (data) => api.post('/menu/categorias', data),
  updateCategoria: (id, data) => api.put(`/menu/categorias/${id}`, data),
  // Platos
  getPlatos: (params) => api.get('/menu/platos', { params }),
  getPlatoById: (id) => api.get(`/menu/platos/${id}`),
  createPlato: (data) => api.post('/menu/platos', data),
  updatePlato: (id, data) => api.put(`/menu/platos/${id}`, data),
  toggleDisponibilidad: (id, disponible) => api.patch(`/menu/platos/${id}/disponibilidad`, { disponible }),
  // Ingredientes
  getIngredientes: () => api.get('/menu/ingredientes'),
  createIngrediente: (data) => api.post('/menu/ingredientes', data),
  // Alergias
  getAlergias: () => api.get('/menu/alergias'),
  getPlatosSeguros: (usuarioId) => api.get(`/menu/platos-seguros/${usuarioId}`),
}

export const parametrosApi = {
  getAll: () => api.get('/parametros'),
  getByClave: (clave) => api.get(`/parametros/${clave}`),
  update: (clave, valor) => api.put(`/parametros/${clave}`, { valor }),
  getHorarios: () => api.get('/parametros/horarios/restaurante'),
  updateHorarios: (horarios) => api.put('/parametros/horarios/restaurante', { horarios }),
}

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  verificarEmail: (codigo) => api.post('/auth/verificar-email', { codigo }),
  reenviarCodigo: () => api.post('/auth/reenviar-codigo'),
}

export const storageApi = {
  upload: (folder, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/storage/upload/${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
  },
  delete: (folder, filename) => api.delete(`/storage/${folder}/${filename}`),
  /**
   * Elimina una imagen del bucket dado su URL pública de Supabase.
   * Extrae folder/filename de la URL. Si falla o la URL no es de storage, no lanza error.
   */
  deleteByUrl: (url) => {
    if (!url) return Promise.resolve()
    // URL pattern: .../object/public/BUCKET_NAME/folder/filename
    const match = url.match(/\/object\/public\/[^/]+\/(.+?)\/(.+)$/)
    if (!match) return Promise.resolve()
    return api.delete(`/storage/${match[1]}/${match[2]}`).catch((err) => {
      console.warn('[storageApi] No se pudo eliminar del bucket:', err)
    })
  },
}

export const usuariosApi = {
  getById: (id) => api.get(`/usuarios/${id}`),
  getPerfil: (id) => api.get(`/usuarios/${id}/perfil`),
  updatePerfil: (id, data) => api.put(`/usuarios/${id}/perfil`, data),
  getAlergias: (id) => api.get(`/usuarios/${id}/alergias`),
  setAlergias: (id, alergiasIds) => api.post(`/usuarios/${id}/alergias`, { alergias_ids: alergiasIds }),
}

export default api
