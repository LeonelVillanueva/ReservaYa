import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    emailVerificado: (state) => state.user?.email_verificado ?? false,
    userNombre: (state) => state.user ? `${state.user.nombre} ${state.user.apellido}`.trim() : '',
    esManager: (state) => state.user?.rol_id === 1,
  },

  actions: {
    async login(credentials) {
      try {
        const response = await authApi.login(credentials)
        if (!response?.token || !response?.user) {
          throw new Error(response?.error || 'Error al iniciar sesión')
        }
        this.token = response.token
        this.user = response.user
        localStorage.setItem('token', response.token)
      } catch (err) {
        const data = err?.response?.data ?? err
        if (data && data.code === 'EMAIL_NO_VERIFICADO' && data.token && data.user) {
          this.token = data.token
          this.user = data.user
          localStorage.setItem('token', data.token)
          const e = new Error(data.error || 'Correo no verificado')
          e.code = 'EMAIL_NO_VERIFICADO'
          throw e
        }
        throw err
      }
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

    async verificarEmail(codigo) {
      const response = await authApi.verificarEmail(codigo)
      if (response?.user) {
        this.user = response.user
      }
      return response
    },

    async reenviarCodigo() {
      return authApi.reenviarCodigo()
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },
  },
})
