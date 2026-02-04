<template>
  <MainLayout>
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="card p-6 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Bienvenido, {{ authStore.userNombre }}</h1>
          <p class="text-gray-600 mt-1">Gestiona tus reservas desde aquí.</p>
        </div>
      </div>

      <!-- Layout dos columnas: mesas a la izquierda, reservas a la derecha -->
      <div class="grid gap-6 md:grid-cols-2 items-start">
        <!-- Mesas disponibles -->
        <div class="card p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Mesas del restaurante</h2>
            <div
              v-if="!loadingMesas && mesasConEstado.length"
              class="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1"
            >
              <span class="flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                {{ resumenMesas.disponibles }} disponibles
              </span>
              <span class="text-gray-400">·</span>
              <span class="flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full bg-orange-500" aria-hidden="true" />
                {{ resumenMesas.reservadas }} reservadas
              </span>
              <span class="text-gray-400">·</span>
              <span class="flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                {{ resumenMesas.ocupadas }} ocupadas
              </span>
            </div>
          </div>
          <router-link
            v-if="authStore.esManager"
            :to="{ name: 'admin-panorama-mesas' }"
            class="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium text-primary-600 border border-primary-100 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 transition-colors"
          >
            Ver todas las mesas
          </router-link>
        </div>
          <div v-if="loadingMesas" class="flex justify-center py-8">
            <span class="text-gray-500">Cargando mesas...</span>
          </div>
          <div v-else-if="!mesasConEstado.length" class="text-center py-8 text-gray-500">
            No hay mesas configuradas.
          </div>
          <div
            v-else
            ref="mesasPanelRef"
            class="resize-y overflow-y-auto max-h-[640px] min-h-[260px] pr-1"
            :style="{ height: mesasPanelHeight }"
          >
            <div
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div
                v-for="m in mesasConEstado"
                :key="m.id"
                class="flex flex-col rounded-lg overflow-hidden bg-gray-100 cursor-default"
                :class="m.estado && m.estado !== 'disponible' ? 'hover:ring-2 hover:ring-primary-300 cursor-pointer' : ''"
                @click="m.estado && m.estado !== 'disponible' ? abrirModalMesa(m) : null"
              >
              <span class="text-center text-sm font-semibold text-gray-900 py-1">Mesa {{ m.numero_mesa }}</span>
              <div class="relative flex-1 aspect-square">
                <img
                  src="/logos/mesa.webp"
                  :alt="'Mesa ' + m.numero_mesa + ', estado: ' + (m.estado || 'disponible')"
                  class="w-full h-full object-contain"
                />
              <div
                class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shadow bg-yellow-100 text-gray-700"
              >
                {{ m.capacidad ?? 0 }} pers.
              </div>
              <div
                class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shadow"
                :class="estadoMesaBadgeClase(m.estado)"
              >
                {{ (m.estado || 'disponible') }}
              </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reservas (todas/mis reservas) -->
        <div class="card p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 class="text-base font-semibold text-gray-900">
              {{ authStore.esManager ? 'Todas las reservas' : 'Mis reservas' }}
            </h2>
            <router-link to="/reservas/nueva" class="text-xs font-medium text-primary-600 hover:text-primary-700">+ Nueva reserva</router-link>
          </div>
          <p v-if="errorAccion" class="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ errorAccion }}</p>
          <div v-if="reservasStore.loading" class="flex justify-center py-6 text-sm text-gray-500">Cargando reservas...</div>
          <div v-else-if="!reservasList.length" class="text-center py-6 text-sm text-gray-500 rounded-lg border border-dashed border-gray-200">
            No hay reservas. <router-link to="/reservas/nueva" class="text-primary-600 hover:underline">Crear una</router-link>
          </div>
          <div v-else class="space-y-2">
          <article
            v-for="r in reservasList"
            :key="r.id"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:border-gray-300 transition-colors"
          >
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span class="font-semibold text-gray-900">{{ formatoFecha(r.fecha) }}</span>
              <span class="text-gray-400">·</span>
              <span class="text-gray-800">{{ horaCorta(r.hora) }}</span>
              <span v-if="r.mesa" class="px-1 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">Mesa {{ r.mesa?.numero_mesa }}</span>
              <span v-if="r.reserva_por_llamada" class="px-1 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">Por llamada</span>
              <span class="ml-auto px-1.5 py-0.5 rounded text-[11px] font-medium" :class="estadoClase(r.estado?.nombre)">{{ estadoEtiqueta(r.estado?.nombre) }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-600">
              <span class="font-medium text-gray-800">{{ nombreReserva(r) }}</span>
              <template v-if="authStore.esManager">
                <span v-if="emailReserva(r)" class="text-gray-500 truncate max-w-[180px]">{{ emailReserva(r) }}</span>
                <span v-if="telefonoReserva(r)" class="text-gray-500">{{ telefonoReserva(r) }}</span>
              </template>
              <span class="text-gray-400">·</span>
              <span>{{ r.cantidad_personas }} {{ r.cantidad_personas === 1 ? 'persona' : 'personas' }}</span>
            </div>
            <div v-if="r.estado?.nombre === 'en_gracia'" class="mt-1 text-xs font-medium text-amber-700">
              Gracia: {{ graciaRestante(r) }}
              <span v-if="graciaExpirada(r)" class="block mt-0.5 text-amber-800">Tiempo agotado. Elija una acción:</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
              <!-- Pendiente: confirmar llegada o iniciar gracia (solo cerca de la hora de la reserva) -->
              <template v-if="authStore.esManager && r.estado?.nombre === 'pendiente' && puedeAccionPendienteCercana(r)">
                <AlertDialog>
                  <AlertDialogTrigger>
                    <button type="button" class="px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200">Confirmar llegada</button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar llegada</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Confirmar que el cliente llegó? Se ocuparán las mesas asignadas a esta reserva.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction @click="confirmarLlegada(r.id)">Sí, confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <button type="button" class="px-2.5 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200">15 min gracia</button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Período de gracia</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Iniciar período de gracia de 15 minutos? Al terminar el tiempo podrá marcar no show o confirmar llegada con retraso.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction @click="iniciarGracia(r.id)">Iniciar gracia</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </template>
              <!-- En gracia y tiempo agotado: no show o llegada con retraso -->
              <template v-if="authStore.esManager && r.estado?.nombre === 'en_gracia' && graciaExpirada(r)">
                <AlertDialog>
                  <AlertDialogTrigger>
                    <button type="button" class="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100">No show</button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>No show</AlertDialogTitle>
                      <AlertDialogDescription>
                        El cliente no llegó. ¿Dar por perdida la reserva? Se liberarán las mesas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction @click="expirarGracia(r.id)" class="bg-red-600 hover:bg-red-700 text-white">Sí, no show</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger>
                    <button type="button" class="px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200">Llegada con retraso</button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Llegada con retraso</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿El cliente llegó con retraso? Se confirmará la llegada y se ocuparán las mesas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No</AlertDialogCancel>
                      <AlertDialogAction @click="confirmarLlegada(r.id)">Sí, confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </template>
              <!-- Cancelar (solo pendiente o confirmada, no en_gracia) -->
              <AlertDialog v-if="puedeCancelar(r) && r.estado?.nombre !== 'en_gracia'">
                <AlertDialogTrigger>
                  <button type="button" class="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100">Cancelar</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Cancelar esta reserva? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction @click="cancelar(r.id)" class="bg-red-600 hover:bg-red-700 text-white">Sí, cancelar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </article>
          </div>
        </div>
      </div>

      <!-- Modal información de mesa reservada / ocupada -->
      <Transition name="modal">
        <div
          v-if="mesaSeleccionada"
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          @click.self="cerrarModalMesa"
        >
          <div class="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200 p-7 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  Mesa {{ mesaSeleccionada.numero_mesa }}
                </h2>
                <p class="text-xs text-gray-500">
                  Capacidad: {{ mesaSeleccionada.capacidad ?? 0 }} personas
                </p>
              </div>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="estadoMesaBadgeClase(mesaSeleccionada.estado)"
              >
                {{ (mesaSeleccionada.estado || 'disponible') }}
              </span>
            </div>

            <div v-if="reservasMesaSeleccionada.length" class="space-y-6 mb-6">
              <p class="text-xs sm:text-sm font-semibold text-gray-800 uppercase tracking-wide mb-2">
                Reservas relacionadas para hoy
              </p>
              <div
                v-for="r in reservasMesaSeleccionada"
                :key="r.id"
                class="rounded-2xl border border-gray-200 px-5 py-4 text-xs sm:text-sm text-gray-700 bg-gray-50/80 space-y-3"
              >
                <!-- Bloque 1: resumen compacto -->
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-[10px] font-semibold text-gray-900">
                    {{ formatoFechaLargo(r.fecha) }}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-white text-[10px] font-medium text-gray-800">
                    {{ horaAmPm(r.hora) }}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700">
                    {{ r.cantidad_personas }} {{ r.cantidad_personas === 1 ? 'persona' : 'personas' }}
                  </span>
                  <span
                    class="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                    :class="estadoClase(r.estado?.nombre)"
                  >
                    {{ estadoEtiqueta(r.estado?.nombre) }}
                  </span>
                </div>

                <!-- Bloque 2: cliente y contacto -->
                <div class="border-t border-gray-200 pt-3 space-y-2">
                  <div>
                    <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Cliente
                    </p>
                    <p class="text-[11px] sm:text-xs text-gray-800 flex items-center gap-2">
                      <span>{{ nombreReserva(r) }}</span>
                      <span
                        v-if="r.reserva_por_llamada"
                        class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium whitespace-nowrap"
                      >
                        Reserva por llamada
                      </span>
                    </p>
                  </div>

                  <div v-if="emailReserva(r)">
                    <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Email
                    </p>
                    <p class="text-[11px] sm:text-xs text-gray-700 break-all">
                      {{ emailReserva(r) }}
                    </p>
                  </div>

                  <div v-if="telefonoReserva(r)">
                    <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                      Teléfono
                    </p>
                    <p class="text-[11px] sm:text-xs text-gray-700">
                      {{ telefonoReserva(r) }}
                    </p>
                  </div>
                </div>

                <!-- Bloque 3: detalle de la reserva -->
                <div class="border-t border-gray-200 pt-3 space-y-1.5">
                  <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle de la reserva
                  </p>
                  <p class="text-[11px] sm:text-xs text-gray-600">
                    Cantidad: {{ r.cantidad_personas }} {{ r.cantidad_personas === 1 ? 'persona' : 'personas' }}
                  </p>
                  <p class="text-[11px] sm:text-xs text-gray-600">
                    Estado de la mesa: {{ estadoEtiqueta(mesaSeleccionada.estado) }}
                  </p>
                  <p class="text-[11px] sm:text-xs text-gray-600">
                    Estado de la reserva: {{ estadoEtiqueta(r.estado?.nombre) }}
                    <span v-if="r.duracion_estimada_minutos">
                      · Duración estimada: {{ r.duracion_estimada_minutos }} min
                    </span>
                  </p>
                </div>

                <!-- Bloque 4: notas -->
                <div v-if="r.notas" class="border-t border-gray-200 pt-3">
                  <p class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                    Notas
                  </p>
                  <p class="text-[11px] sm:text-xs text-gray-600 leading-snug">
                    {{ r.notas }}
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-gray-500 mb-4">
              No se encontraron reservas activas asociadas a esta mesa para hoy.
            </p>

            <div class="flex justify-end">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                @click="cerrarModalMesa"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { useMesasConEstado, invalidateMesasCache } from '@/composables/useMesasConEstado'
import { reservasApi } from '@/api'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

const router = useRouter()
const authStore = useAuthStore()
const reservasStore = useReservasStore()

const { mesasConEstado, loadingMesas, cargarMesas } = useMesasConEstado()
const errorAccion = ref('')
const mesaSeleccionada = ref(null)
const mesasPanelRef = ref(null)

function getInitialMesasPanelHeight() {
  try {
    const stored = localStorage.getItem('home_mesas_panel_height')
    if (stored) return stored
  } catch {}
  return '360px'
}

const mesasPanelHeight = ref(getInitialMesasPanelHeight())

// Solo reservas activas; ocultar canceladas y no_show
const reservasList = computed(() => {
  const list = reservasStore.reservas || []
  const ocultar = ['cancelada', 'no_show']
  const debeOcultar = (r) => ocultar.includes((r.estado?.nombre || '').toLowerCase())
  return list.filter((r) => !debeOcultar(r)).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
})

const resumenMesas = computed(() => {
  const list = mesasConEstado.value || []
  return {
    disponibles: list.filter(m => (m.estado || 'disponible').toLowerCase() === 'disponible').length,
    reservadas: list.filter(m => (m.estado || '').toLowerCase() === 'reservado').length,
    ocupadas: list.filter(m => (m.estado || '').toLowerCase() === 'ocupado').length,
  }
})

const reservasMesaSeleccionada = computed(() => {
  if (!mesaSeleccionada.value) return []
  const mesaId = mesaSeleccionada.value.id
  const hoy = new Date().toISOString().slice(0, 10)
  // Filtrar reservas del día actual asociadas a esa mesa principal
  return (reservasStore.reservas || []).filter(r => {
    if (!r.fecha || r.fecha !== hoy) return false
    if (!r.mesa?.id) return false
    return r.mesa.id === mesaId
  })
})

function estadoMesaBadgeClase(estado) {
  const e = (estado || 'disponible').toLowerCase()
  if (e === 'ocupado') return 'bg-red-100 text-red-700'
  if (e === 'reservado') return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
}

function abrirModalMesa(mesa) {
  mesaSeleccionada.value = mesa
}

function cerrarModalMesa() {
  mesaSeleccionada.value = null
}

function formatoFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatoFechaLargo(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function horaCorta(hora) {
  if (!hora) return '—'
  const s = String(hora)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function horaAmPm(hora) {
  if (!hora) return '—'
  const [hStr, mStr] = String(hora).slice(0, 5).split(':')
  const hNum = Number(hStr)
  if (Number.isNaN(hNum)) return String(hora)
  const sufijo = hNum >= 12 ? 'PM' : 'AM'
  const h12 = ((hNum + 11) % 12) + 1
  return `${h12}:${mStr} ${sufijo}`
}

function nombreReserva(r) {
  if (r.reserva_por_llamada || r.nombre_cliente) return r.nombre_cliente || '—'
  if (r.usuario?.nombre || r.usuario?.apellido) {
    return [r.usuario.nombre, r.usuario.apellido].filter(Boolean).join(' ')
  }
  return '—'
}

function emailReserva(r) {
  if (r.reserva_por_llamada) return null
  return r.usuario?.email || null
}

function telefonoReserva(r) {
  if (r.reserva_por_llamada && r.telefono_cliente) return r.telefono_cliente
  return r.usuario?.telefono || null
}

function estadoClase(nombre) {
  const n = (nombre || '').toLowerCase()
  if (n === 'confirmada') return 'bg-green-100 text-green-800'
  if (n === 'cancelada' || n === 'no_show') return 'bg-gray-100 text-gray-600'
  if (n === 'completada') return 'bg-blue-100 text-blue-800'
  if (n === 'en_gracia') return 'bg-amber-100 text-amber-800'
  return 'bg-amber-100 text-amber-800'
}

function estadoEtiqueta(nombre) {
  if (!nombre) return '—'
  return String(nombre).replace('_', ' ')
}

function puedeCancelar(r) {
  const nombre = (r.estado?.nombre || '').toLowerCase()
  return nombre === 'pendiente' || nombre === 'confirmada'
}

// Oculta los botones si falta más de 60 min para la hora programada.
function puedeAccionPendienteCercana(r) {
  if (!r || !r.fecha || !r.hora) return false
  const horaStr = String(r.hora).slice(0, 5)
  const fechaHora = new Date(`${r.fecha}T${horaStr}:00`)
  if (Number.isNaN(fechaHora.getTime())) return false
  const diffMin = (fechaHora.getTime() - ahora.value) / 60000
  return diffMin <= 60
}

async function cancelar(id) {
  errorAccion.value = ''
  try {
    await reservasStore.cancelarReserva(id)
    await reservasStore.fetchReservas(paramsReservas())
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al cancelar'
  }
}

function paramsReservas() {
  if (authStore.esManager) return {}
  return { usuario_id: authStore.user?.id }
}

const ahora = ref(Date.now())

function graciaRestante(r) {
  if ((r.estado?.nombre || '') !== 'en_gracia' || !r.gracia_hasta) return null
  const fin = new Date(r.gracia_hasta).getTime()
  const rest = Math.max(0, Math.ceil((fin - ahora.value) / 1000))
  if (rest <= 0) return '0:00'
  const m = Math.floor(rest / 60)
  const s = rest % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function graciaExpirada(r) {
  if ((r.estado?.nombre || '') !== 'en_gracia' || !r.gracia_hasta) return false
  return new Date(r.gracia_hasta).getTime() <= ahora.value
}

async function confirmarLlegada(id) {
  errorAccion.value = ''
  try {
    await reservasApi.confirmar(id)
    await reservasStore.fetchReservas(paramsReservas())
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al confirmar'
  }
}

async function iniciarGracia(id) {
  errorAccion.value = ''
  try {
    await reservasApi.iniciarGracia(id)
    await reservasStore.fetchReservas(paramsReservas())
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al iniciar gracia'
  }
}

async function expirarGracia(id) {
  errorAccion.value = ''
  try {
    await reservasApi.expirarGracia(id)
    await reservasStore.fetchReservas(paramsReservas())
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al marcar no show'
  }
}

let intervalId = null
let mesasResizeObserver = null
onMounted(async () => {
  await Promise.all([
    reservasStore.fetchReservas(paramsReservas()),
    cargarMesas(),
  ])
  // Actualizar reloj para gracia / botones cercanos a la hora
  intervalId = setInterval(() => {
    ahora.value = Date.now()
  }, 1000)

  // Observar cambios de altura del panel de mesas y persistir en localStorage
  if (typeof ResizeObserver !== 'undefined' && mesasPanelRef.value) {
    mesasResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = `${Math.round(entry.contentRect.height)}px`
        mesasPanelHeight.value = h
        try {
          localStorage.setItem('home_mesas_panel_height', h)
        } catch {}
      }
    })
    mesasResizeObserver.observe(mesasPanelRef.value)
  }
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (mesasResizeObserver && mesasPanelRef.value) {
    mesasResizeObserver.unobserve(mesasPanelRef.value)
  }
  mesasResizeObserver = null
})

function cerrarSesion() {
  reservasStore.reservas = []
  authStore.logout()
  router.push('/')
}
</script>
