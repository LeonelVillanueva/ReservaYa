<template>
  <MainLayout>
    <div class="max-w-xl mx-auto px-4 py-8">
      <div class="card p-6">
        <div class="flex items-center gap-3 mb-6">
          <router-link to="/inicio" class="text-gray-500 hover:text-gray-700">← Volver</router-link>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-6">Nueva reserva</h1>

        <p v-if="error" class="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>

        <form @submit.prevent="enviar" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                v-model="form.fecha"
                type="date"
                class="input"
                required
                :min="fechaMinima"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                v-model="form.hora"
                type="time"
                class="input"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número de personas</label>
            <input
              v-model.number="form.cantidad_personas"
              type="number"
              min="1"
              max="20"
              class="input"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mesa</label>
            <select v-model="form.mesa_id" class="input" required>
              <option value="">Seleccione fecha y hora primero</option>
              <option
                v-for="m in mesasDisponibles"
                :key="m.id"
                :value="m.id"
              >
                Mesa {{ m.numero_mesa }} ({{ m.capacidad }} personas)
              </option>
            </select>
            <p v-if="form.fecha && form.hora && !cargandoMesas && mesasDisponibles.length === 0" class="mt-1 text-sm text-amber-600">
              No hay mesas disponibles en ese horario. Pruebe otra fecha u hora.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              v-model="form.notas"
              class="input"
              rows="2"
              placeholder="Alergias, preferencias..."
            />
          </div>

          <div v-if="montoAnticipo !== null" class="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Anticipo a abonar: <strong>{{ montoAnticipoFormateado }}</strong>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary" :disabled="loading || !puedeEnviar">
              {{ loading ? 'Creando...' : 'Confirmar reserva' }}
            </button>
            <router-link to="/inicio" class="btn-secondary">Cancelar</router-link>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { reservasApi, mesasApi, parametrosApi } from '@/api'

const router = useRouter()
const authStore = useAuthStore()
const reservasStore = useReservasStore()

const form = ref({
  fecha: '',
  hora: '20:00',
  cantidad_personas: 2,
  mesa_id: '',
  notas: ''
})

const mesasDisponibles = ref([])
const cargandoMesas = ref(false)
const montoAnticipo = ref(null)
const error = ref('')
const loading = ref(false)

const fechaMinima = computed(() => {
  const today = new Date()
  return today.toISOString().slice(0, 10)
})

const montoAnticipoFormateado = computed(() => {
  if (montoAnticipo.value === null || montoAnticipo.value === '') return 'Sin monto configurado'
  const n = parseFloat(montoAnticipo.value)
  return isNaN(n) ? montoAnticipo.value : `$${n.toFixed(2)}`
})

const puedeEnviar = computed(() => {
  return form.value.fecha && form.value.hora && form.value.mesa_id && form.value.cantidad_personas >= 1
})

async function cargarMontoAnticipo() {
  try {
    const p = await parametrosApi.getByClave('monto_anticipo')
    montoAnticipo.value = p?.valor ?? ''
  } catch {
    montoAnticipo.value = ''
  }
}

async function cargarMesasDisponibles() {
  if (!form.value.fecha || !form.value.hora) {
    mesasDisponibles.value = []
    return
  }
  cargandoMesas.value = true
  form.value.mesa_id = ''
  try {
    const list = await mesasApi.getDisponibles({
      fecha: form.value.fecha,
      hora: form.value.hora + (form.value.hora.length === 5 ? ':00' : ''),
      duracion: 120,
      capacidad_minima: form.value.cantidad_personas || 1
    })
    mesasDisponibles.value = list || []
  } catch {
    mesasDisponibles.value = []
  } finally {
    cargandoMesas.value = false
  }
}

watch(
  () => [form.value.fecha, form.value.hora, form.value.cantidad_personas],
  () => cargarMesasDisponibles(),
  { deep: true }
)

async function enviar() {
  error.value = ''
  loading.value = true
  try {
    const monto = montoAnticipo.value !== null && montoAnticipo.value !== ''
      ? parseFloat(montoAnticipo.value)
      : 0
    const horaCompleta = form.value.hora.length === 5 ? form.value.hora + ':00' : form.value.hora

    await reservasApi.create({
      usuario_id: authStore.user.id,
      creado_por_id: authStore.user.id,
      mesa_id: form.value.mesa_id,
      fecha: form.value.fecha,
      hora: horaCompleta,
      cantidad_personas: form.value.cantidad_personas,
      duracion_estimada_minutos: 120,
      notas: form.value.notas || undefined,
      monto_anticipo: monto,
      metodo_pago_id: 1
    })

    await reservasStore.fetchReservas(authStore.esManager ? {} : { usuario_id: authStore.user.id })
    router.push('/inicio')
  } catch (err) {
    error.value = err?.error || err?.message || 'Error al crear la reserva'
  } finally {
    loading.value = false
  }
}

cargarMontoAnticipo()
</script>
