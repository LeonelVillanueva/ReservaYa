<template>
  <MainLayout>
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="card p-6 mb-6">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Bienvenido, {{ authStore.userNombre }}</h1>
            <p class="text-gray-600 mt-1">Gestiona tus reservas desde aquí.</p>
          </div>
          <div class="flex items-center gap-3">
            <router-link to="/reservas/nueva" class="btn-primary">Nueva reserva</router-link>
            <button type="button" @click="cerrarSesion" class="btn-secondary">Cerrar sesión</button>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          {{ authStore.esManager ? 'Todas las reservas' : 'Mis reservas' }}
        </h2>
        <div v-if="reservasStore.loading" class="flex justify-center py-8">
          <span class="text-gray-500">Cargando reservas...</span>
        </div>
        <div v-else-if="!reservasList.length" class="text-center py-8 text-gray-500">
          No hay reservas. <router-link to="/reservas/nueva" class="text-primary-600 hover:underline">Crear una</router-link>
        </div>
        <ul v-else class="divide-y divide-gray-200">
          <li
            v-for="r in reservasList"
            :key="r.id"
            class="py-3 flex flex-wrap items-center justify-between gap-2"
          >
            <div>
              <span class="font-medium text-gray-900">{{ formatoFecha(r.fecha) }}</span>
              <span class="text-gray-500 mx-2">·</span>
              <span class="text-gray-700">{{ r.hora }}</span>
              <span class="text-gray-500 mx-2">·</span>
              <span class="text-gray-600">{{ r.cantidad_personas }} personas</span>
              <span v-if="r.mesa" class="text-gray-500 text-sm"> — Mesa {{ r.mesa?.numero_mesa }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="estadoClase(r.estado?.nombre)"
              >
                {{ r.estado?.nombre || '—' }}
              </span>
              <button
                v-if="puedeCancelar(r)"
                type="button"
                @click="cancelar(r.id)"
                class="text-sm text-red-600 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'

const router = useRouter()
const authStore = useAuthStore()
const reservasStore = useReservasStore()

const reservasList = computed(() => reservasStore.reservas || [])

function formatoFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function estadoClase(nombre) {
  const n = (nombre || '').toLowerCase()
  if (n === 'confirmada') return 'bg-green-100 text-green-800'
  if (n === 'cancelada' || n === 'no_show') return 'bg-gray-100 text-gray-600'
  if (n === 'completada') return 'bg-blue-100 text-blue-800'
  return 'bg-amber-100 text-amber-800'
}

function puedeCancelar(r) {
  const nombre = (r.estado?.nombre || '').toLowerCase()
  return nombre === 'pendiente' || nombre === 'confirmada'
}

async function cancelar(id) {
  if (!confirm('¿Cancelar esta reserva?')) return
  try {
    await reservasStore.cancelarReserva(id)
    await reservasStore.fetchReservas(paramsReservas())
  } catch (err) {
    alert(err?.error || err?.message || 'Error al cancelar')
  }
}

function paramsReservas() {
  if (authStore.esManager) return {}
  return { usuario_id: authStore.user?.id }
}

onMounted(async () => {
  await reservasStore.fetchReservas(paramsReservas())
})

function cerrarSesion() {
  reservasStore.reservas = []
  authStore.logout()
  router.push('/')
}
</script>
