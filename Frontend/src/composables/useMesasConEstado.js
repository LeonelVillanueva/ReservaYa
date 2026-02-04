import { ref, readonly } from 'vue'
import { mesasApi } from '@/api'

const CACHE_KEY = 'reserva_ya_mesas_con_estado'
const TTL_MS = 60 * 1000 // 60 segundos

function getCached(fecha) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { fecha: cachedFecha, data, timestamp } = JSON.parse(raw)
    if (cachedFecha !== fecha) return null
    if (Date.now() - timestamp > TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function setCached(fecha, data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fecha, data, timestamp: Date.now() })
    )
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
}

export function invalidateMesasCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {}
}

export function useMesasConEstado() {
  const mesasConEstado = ref([])
  const loadingMesas = ref(false)

  async function cargarMesas(fecha = new Date().toISOString().slice(0, 10)) {
    const cached = getCached(fecha)
    if (cached) {
      mesasConEstado.value = cached
      loadingMesas.value = false
      return
    }

    loadingMesas.value = true
    try {
      const data = await mesasApi.getConEstado({ fecha })
      const list = data || []
      mesasConEstado.value = list
      setCached(fecha, list)
    } catch {
      mesasConEstado.value = []
    } finally {
      loadingMesas.value = false
    }
  }

  return {
    mesasConEstado: readonly(mesasConEstado),
    loadingMesas: readonly(loadingMesas),
    cargarMesas,
  }
}
