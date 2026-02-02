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
    if (error.response?.status === 401) {
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
  completar: (id, data) => api.patch(`/reservas/${id}/completar`, data),
}

export const mesasApi = {
  getAll: () => api.get('/mesas'),
  getDisponibles: (params) => api.get('/mesas/disponibles', { params }),
  getById: (id) => api.get(`/mesas/${id}`),
}

export const menuApi = {
  getCategorias: () => api.get('/menu/categorias'),
  getPlatos: (params) => api.get('/menu/platos', { params }),
  getPlatoById: (id) => api.get(`/menu/platos/${id}`),
  getAlergias: () => api.get('/menu/alergias'),
  getPlatosSeguros: (usuarioId) => api.get(`/menu/platos-seguros/${usuarioId}`),
}

export const parametrosApi = {
  getAll: () => api.get('/parametros'),
  getByClave: (clave) => api.get(`/parametros/${clave}`),
  update: (clave, valor) => api.put(`/parametros/${clave}`, { valor }),
  getHorarios: () => api.get('/parametros/horarios/restaurante'),
}

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  verificarEmail: (codigo) => api.post('/auth/verificar-email', { codigo }),
  reenviarCodigo: () => api.post('/auth/reenviar-codigo'),
}

export const usuariosApi = {
  getById: (id) => api.get(`/usuarios/${id}`),
  getPerfil: (id) => api.get(`/usuarios/${id}/perfil`),
  updatePerfil: (id, data) => api.put(`/usuarios/${id}/perfil`, data),
  getAlergias: (id) => api.get(`/usuarios/${id}/alergias`),
  setAlergias: (id, alergiasIds) => api.post(`/usuarios/${id}/alergias`, { alergias_ids: alergiasIds }),
}

export default api
