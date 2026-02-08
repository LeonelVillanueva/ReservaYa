import { defineStore } from 'pinia'
import { parametrosApi } from '@/api'

// Fallbacks: imágenes estáticas locales (si el admin no ha subido nada)
const DEFAULTS = {
  imagen_logo_principal: '/logos/IMGReservaYa.webp',
  imagen_logo_letras: '/logos/Logo_letras.webp',
  imagen_mesa: '/logos/mesa.webp',
}

const MAX_CARRUSEL = 5

export const useAppImagesStore = defineStore('appImages', {
  state: () => ({
    imagenes: {
      imagen_logo_principal: null,
      imagen_logo_letras: null,
      imagen_mesa: null,
    },
    // Carrusel
    carruselImagenes: [],   // Array de URLs
    carruselIntervalo: 5,   // Segundos entre slides
    maxCarrusel: MAX_CARRUSEL,
    loaded: false,
  }),

  getters: {
    /** Logo principal (fondo de login/registro) */
    logoUrl: (state) => state.imagenes.imagen_logo_principal || DEFAULTS.imagen_logo_principal,

    /** Logo con letras (header, footer, 404) */
    logoLetrasUrl: (state) => state.imagenes.imagen_logo_letras || DEFAULTS.imagen_logo_letras,

    /** Imagen de mesa */
    mesaUrl: (state) => state.imagenes.imagen_mesa || DEFAULTS.imagen_mesa,
  },

  actions: {
    /**
     * Carga las URLs de imágenes desde los parámetros del backend.
     * Se llama al montar la app.
     */
    async cargar() {
      // No llamar a la API si no hay token (evita 401 en loop en la página de login)
      const token = localStorage.getItem('token')
      if (!token) {
        this.loaded = true
        return
      }

      try {
        const data = await parametrosApi.getAll()
        const params = Array.isArray(data) ? data : []

        for (const p of params) {
          if (p.clave in this.imagenes && p.valor) {
            this.imagenes[p.clave] = p.valor
          }
          // Carrusel
          if (p.clave === 'carrusel_imagenes' && p.valor) {
            try { this.carruselImagenes = JSON.parse(p.valor) } catch { this.carruselImagenes = [] }
          }
          if (p.clave === 'carrusel_intervalo' && p.valor) {
            const n = Number(p.valor)
            if (n > 0) this.carruselIntervalo = n
          }
        }
      } catch (err) {
        console.warn('[appImages] No se pudieron cargar las imágenes desde parámetros:', err)
      } finally {
        this.loaded = true
      }
    },

    /**
     * Actualiza una imagen en el store y en el backend.
     * @param {'imagen_logo_principal'|'imagen_logo_letras'|'imagen_mesa'} clave
     * @param {string|null} url - URL de Supabase o null para volver al default
     */
    async guardar(clave, url) {
      if (!(clave in this.imagenes)) return

      await parametrosApi.update(clave, url || '')
      this.imagenes[clave] = url || null
    },

    /**
     * Guarda la configuración del carrusel en el backend.
     */
    async guardarCarrusel() {
      await parametrosApi.update('carrusel_imagenes', JSON.stringify(this.carruselImagenes))
      await parametrosApi.update('carrusel_intervalo', String(this.carruselIntervalo))
    },

    /**
     * Agrega una imagen al carrusel y persiste.
     * @param {string} url
     */
    async agregarImagenCarrusel(url) {
      if (this.carruselImagenes.length >= MAX_CARRUSEL) {
        throw new Error(`El carrusel ya tiene el máximo de ${MAX_CARRUSEL} imágenes`)
      }
      this.carruselImagenes.push(url)
      await this.guardarCarrusel()
    },

    /**
     * Agrega varias imágenes al carrusel de una vez y persiste.
     * @param {string[]} urls
     */
    async agregarImagenesCarrusel(urls) {
      const disponibles = MAX_CARRUSEL - this.carruselImagenes.length
      if (urls.length > disponibles) {
        throw new Error(`Solo hay espacio para ${disponibles} imagen(es) más (máximo ${MAX_CARRUSEL})`)
      }
      this.carruselImagenes.push(...urls)
      await this.guardarCarrusel()
    },

    /**
     * Elimina una imagen del carrusel por índice y persiste.
     * @param {number} index
     */
    async eliminarImagenCarrusel(index) {
      this.carruselImagenes.splice(index, 1)
      await this.guardarCarrusel()
    },

    /**
     * Actualiza el intervalo del carrusel y persiste.
     * @param {number} segundos
     */
    async setIntervaloCarrusel(segundos) {
      this.carruselIntervalo = segundos
      await parametrosApi.update('carrusel_intervalo', String(segundos))
    },
  },
})
