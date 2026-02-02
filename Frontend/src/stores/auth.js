import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userNombre: (state) => state.user ? `${state.user.nombre} ${state.user.apellido}`.trim() : '',
    esManager: (state) => state.user?.rol_id === 1,
  },
  
  actions: {
    async login(credentials) {
      const response = await authApi.login(credentials)
      if (!response?.token || !response?.user) {
        throw new Error(response?.error || 'Error al iniciar sesión')
      }
      this.token = response.token
      this.user = response.user
      localStorage.setItem('token', response.token)
    },
    
    async register(data) {
      const response = await authApi.register(data)
      this.token = response.token
      this.user = response.user
      localStorage.setItem('token', response.token)
    },
    
    async fetchUser() {
      if (!this.token) return
      try {
        const user = await authApi.me()
        this.user = user
      } catch {
        this.logout()
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },
  },
})
