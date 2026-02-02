import { defineStore } from 'pinia'
import { reservasApi } from '@/api'

export const useReservasStore = defineStore('reservas', {
  state: () => ({
    reservas: [],
    loading: false,
  }),
  
  actions: {
    async fetchReservas(params = {}) {
      this.loading = true
      try {
        this.reservas = await reservasApi.getAll(params)
        return this.reservas
      } finally {
        this.loading = false
      }
    },
    
    async crearReserva(data) {
      return await reservasApi.create(data)
    },
    
    async cancelarReserva(id) {
      return await reservasApi.cancelar(id)
    },
  },
})
