import { defineStore } from 'pinia'
import { menuApi, storageApi } from '@/api'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    categorias: [],
    platos: [],
    ingredientes: [],
    alergias: [],

    // Paginación de platos
    platosPagination: { total: 0, page: 1, limit: 20 },

    // Estados de carga
    loadingCategorias: false,
    loadingPlatos: false,
    loadingIngredientes: false,
    loadingAlergias: false,
  }),

  getters: {
    totalPaginasPlatos(state) {
      const { total, limit } = state.platosPagination
      return Math.ceil(total / limit) || 1
    },
  },

  actions: {
    // ========== CATEGORÍAS ==========

    async fetchCategorias() {
      this.loadingCategorias = true
      try {
        const data = await menuApi.getCategorias()
        this.categorias = Array.isArray(data) ? data : []
        return this.categorias
      } finally {
        this.loadingCategorias = false
      }
    },

    async createCategoria(payload) {
      const data = await menuApi.createCategoria(payload)
      await this.fetchCategorias()
      return data
    },

    async updateCategoria(id, payload) {
      const data = await menuApi.updateCategoria(id, payload)
      await this.fetchCategorias()
      return data
    },

    async deleteCategoria(id) {
      const data = await menuApi.deleteCategoria(id)
      await this.fetchCategorias()
      return data
    },

    // ========== PLATOS ==========

    async fetchPlatos(params = {}) {
      this.loadingPlatos = true
      try {
        const response = await menuApi.getPlatos(params)

        // Respuesta paginada: { data, total, page, limit }
        if (response && !Array.isArray(response) && response.data) {
          this.platos = response.data || []
          this.platosPagination = {
            total: response.total || 0,
            page: response.page || 1,
            limit: response.limit || 20,
          }
        } else {
          // Respuesta sin paginar: array directo
          this.platos = Array.isArray(response) ? response : []
          this.platosPagination = {
            total: this.platos.length,
            page: 1,
            limit: this.platos.length || 20,
          }
        }
        return this.platos
      } finally {
        this.loadingPlatos = false
      }
    },

    async createPlato(payload) {
      const data = await menuApi.createPlato(payload)
      return data
    },

    async updatePlato(id, payload) {
      const data = await menuApi.updatePlato(id, payload)
      return data
    },

    async deletePlato(id) {
      const response = await menuApi.deletePlato(id)
      // Eliminar imagen del Storage si la tenía
      if (response?.imagen_url) {
        await storageApi.deleteByUrl(response.imagen_url)
      }
      return response
    },

    async toggleDisponibilidad(id, disponible) {
      const data = await menuApi.toggleDisponibilidad(id, disponible)
      // Actualizar en el estado local
      const idx = this.platos.findIndex(p => p.id === id)
      if (idx !== -1) this.platos[idx].disponible = disponible
      return data
    },

    // ========== INGREDIENTES ==========

    async fetchIngredientes() {
      this.loadingIngredientes = true
      try {
        const data = await menuApi.getIngredientes()
        // Aplanar la estructura de alergias de Supabase
        const ingredientes = Array.isArray(data) ? data : []
        this.ingredientes = ingredientes.map(ing => ({
          ...ing,
          alergias: (ing.alergias || [])
            .map(ia => ia.alergia)
            .filter(Boolean),
        }))
        return this.ingredientes
      } finally {
        this.loadingIngredientes = false
      }
    },

    async createIngrediente(payload) {
      const data = await menuApi.createIngrediente(payload)
      await this.fetchIngredientes()
      return data
    },

    async updateIngrediente(id, payload) {
      const data = await menuApi.updateIngrediente(id, payload)
      await this.fetchIngredientes()
      return data
    },

    async deleteIngrediente(id) {
      const data = await menuApi.deleteIngrediente(id)
      await this.fetchIngredientes()
      return data
    },

    // ========== ALERGIAS ==========

    async fetchAlergias() {
      this.loadingAlergias = true
      try {
        const data = await menuApi.getAlergias()
        this.alergias = Array.isArray(data) ? data : []
        return this.alergias
      } finally {
        this.loadingAlergias = false
      }
    },

    async createAlergia(payload) {
      const data = await menuApi.createAlergia(payload)
      await this.fetchAlergias()
      return data
    },

    async updateAlergia(id, payload) {
      const data = await menuApi.updateAlergia(id, payload)
      await this.fetchAlergias()
      return data
    },

    async deleteAlergia(id) {
      const data = await menuApi.deleteAlergia(id)
      await this.fetchAlergias()
      return data
    },
  },
})
