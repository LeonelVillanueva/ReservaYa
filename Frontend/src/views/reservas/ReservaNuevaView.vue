<template>
  <MainLayout>
    <div class="max-w-xl mx-auto px-4 py-8">
      <div class="card p-6">
        <div class="flex items-center gap-3 mb-6">
          <router-link to="/inicio" class="text-gray-500 hover:text-gray-700">← Volver</router-link>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-6">Nueva reserva</h1>

        <p v-if="error" class="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>

        <!-- Solo administrador: opción reserva por llamada (cliente da nombre y teléfono) -->
        <div v-if="authStore.esManager" class="mb-4 flex items-center gap-2">
          <input
            id="reserva-por-llamada"
            v-model="form.reservaPorLlamada"
            type="checkbox"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label for="reserva-por-llamada" class="text-sm font-medium text-gray-700">
            Reservacion por llamada (Cliente)
          </label>
        </div>

        <!-- Datos del titular: perfil del usuario o datos del cliente si es por llamada -->
        <div v-if="!form.reservaPorLlamada" class="mb-5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700 leading-tight">
          <p class="font-medium text-gray-900 text-sm">Reserva a nombre de</p>
          <p class="mt-0.5 text-sm">{{ authStore.userNombre || '—' }}</p>
          <p class="mt-1 text-xs text-gray-600">
            <span v-if="authStore.user?.email">{{ authStore.user.email }}</span>
            <template v-if="authStore.user?.email && authStore.user?.telefono"> · </template>
            <span v-if="authStore.user?.telefono">{{ authStore.user.telefono }}</span>
            <span v-if="!authStore.user?.email && !authStore.user?.telefono">—</span>
          </p>
          <p class="mt-0.5 text-xs text-gray-500">Datos de tu perfil.</p>
        </div>
        <div v-else class="mb-5 rounded-lg bg-amber-50/80 border border-amber-200 px-3 py-3 text-sm leading-tight">
          <p class="font-medium text-amber-900 text-sm mb-3">Datos del cliente</p>
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                v-model="form.nombreCliente"
                type="text"
                class="input"
                placeholder="Nombre y apellido (solo letras)"
                required
                @input="onNombreClienteInput"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
              <div class="flex gap-2">
                <div class="relative w-[120px] shrink-0">
                  <button
                    type="button"
                    class="input flex items-center justify-between px-3 py-2 text-sm w-full"
                    @click="paisClienteOpen = !paisClienteOpen"
                  >
                    <span class="text-lg leading-none">{{ paisSeleccionadoCliente.bandera }}</span>
                    <span class="ml-1 text-[10px] text-gray-500 truncate">+{{ paisSeleccionadoCliente.prefijo }}</span>
                  </button>
                  <div
                    v-if="paisClienteOpen"
                    class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                  >
                    <button
                      v-for="p in paisesCentroamerica"
                      :key="p.codigo"
                      type="button"
                      class="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-gray-100"
                      @click="seleccionarPaisCliente(p)"
                    >
                      <span class="text-lg leading-none">{{ p.bandera }}</span>
                      <span class="ml-2 text-gray-700">{{ p.nombre }} (+{{ p.prefijo }})</span>
                    </button>
                  </div>
                </div>
                <input
                  v-model="form.telefonoCliente"
                  type="tel"
                  inputmode="numeric"
                  class="input flex-1"
                  :maxlength="paisSeleccionadoCliente.digitos + (paisSeleccionadoCliente.digitos > 4 ? 1 : 0)"
                  :placeholder="paisSeleccionadoCliente.digitos === 7 ? '222-2222' : '9999-9999'"
                  @input="onTelefonoClienteInput"
                />
              </div>
            </div>
          </div>
        </div>

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
                :max="fechaMaxima"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input
                v-model="form.hora"
                type="time"
                class="input"
                required
                :min="horaMin"
                :max="horaMax"
                :disabled="diaCerrado"
              />
              <p v-if="form.fecha && horarioParaFechaSeleccionada && !diaCerrado" class="mt-1 text-xs text-gray-500 leading-tight max-w-[280px]">
                Horario {{ horarioParaFechaSeleccionada.hora_apertura?.slice(0, 5) }}–{{ horarioParaFechaSeleccionada.hora_cierre?.slice(0, 5) }}. Última reserva 1h 30min antes del cierre.<span v-if="esHoy"> Hoy: mínimo 2 h desde ahora.</span>
              </p>
              <p v-if="form.fecha && diaCerrado" class="mt-1 text-xs text-amber-600 leading-tight">
                El restaurante está cerrado ese día.
              </p>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Asignación de mesa(s)</label>
            <select
              v-model="form.opcionIndex"
              class="input"
              :required="opcionesAsignacion.length !== 1"
            >
              <option value="">{{ opcionesAsignacion.length ? 'Elija una opción' : 'Seleccione fecha y hora primero' }}</option>
              <option
                v-for="(opcion, idx) in opcionesAsignacion"
                :key="idx"
                :value="idx"
              >
                {{ textoOpcion(opcion) }}
              </option>
            </select>
            <p v-if="form.fecha && form.hora && !cargandoMesas && opcionesAsignacion.length === 1" class="mt-1 text-xs text-gray-500 leading-tight">
              Se asignará automáticamente la única mesa disponible.
            </p>
            <p v-else-if="form.fecha && form.hora && !cargandoMesas && opcionesAsignacion.length > 1" class="mt-1 text-xs text-gray-500 leading-tight">
              Mesas individuales o combinadas según disponibilidad.
            </p>
            <p v-else-if="form.fecha && form.hora && !cargandoMesas && opcionesAsignacion.length === 0" class="mt-1 text-xs text-amber-600 leading-tight py-1.5 px-2 rounded bg-amber-50/80 w-fit max-w-full">
              {{ mensajeSinOpciones }}
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
            <button type="submit" class="btn-primary" :disabled="loading || !puedeEnviar || diaCerrado">
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
import { invalidateMesasCache } from '@/composables/useMesasConEstado'

const router = useRouter()
const authStore = useAuthStore()
const reservasStore = useReservasStore()

const form = ref({
  fecha: '',
  hora: '20:00',
  cantidad_personas: 2,
  opcionIndex: '',
  notas: '',
  reservaPorLlamada: false,
  nombreCliente: '',
  telefonoCliente: ''
})

// Misma lista de países y validación de teléfono que en registro de cuenta
const paisesCentroamerica = [
  { codigo: 'HN', nombre: 'Honduras', prefijo: '504', digitos: 8, bandera: '🇭🇳' },
  { codigo: 'GT', nombre: 'Guatemala', prefijo: '502', digitos: 8, bandera: '🇬🇹' },
  { codigo: 'SV', nombre: 'El Salvador', prefijo: '503', digitos: 8, bandera: '🇸🇻' },
  { codigo: 'NI', nombre: 'Nicaragua', prefijo: '505', digitos: 8, bandera: '🇳🇮' },
  { codigo: 'CR', nombre: 'Costa Rica', prefijo: '506', digitos: 8, bandera: '🇨🇷' },
  { codigo: 'PA', nombre: 'Panamá', prefijo: '507', digitos: 8, bandera: '🇵🇦' },
  { codigo: 'BZ', nombre: 'Belice', prefijo: '501', digitos: 7, bandera: '🇧🇿' },
]
const paisCliente = ref('HN')
const paisClienteOpen = ref(false)
const paisSeleccionadoCliente = computed(() =>
  paisesCentroamerica.find((p) => p.codigo === paisCliente.value) || paisesCentroamerica[0]
)

const opcionesAsignacion = ref([])
const mensajeSinOpciones = ref('No hay mesas disponibles en ese horario. Pruebe otra fecha u hora.')
const cargandoMesas = ref(false)
const montoAnticipo = ref(null)
const diasAnticipoReservaMax = ref(4) // Días máximos para reservar con anticipación (config)
const error = ref('')
const loading = ref(false)
const horariosRestaurante = ref([]) // { dia_semana, hora_apertura, hora_cierre, activo } por día (0=Dom..6=Sab)

const fechaMinima = computed(() => {
  const today = new Date()
  return today.toISOString().slice(0, 10)
})

const fechaMaxima = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + (diasAnticipoReservaMax.value || 4))
  return d.toISOString().slice(0, 10)
})

// Día de la semana de una fecha YYYY-MM-DD (0=Dom, 1=Lun, ..., 6=Sab) - igual que JavaScript getDay()
function diaSemanaDeFecha(fecha) {
  if (!fecha) return null
  return new Date(fecha + 'T12:00:00').getDay()
}

// Normalizar activo (backend puede devolver boolean o string; si no viene, se considera abierto)
function estaActivo(horario) {
  if (horario?.activo === false || horario?.activo === 'false' || horario?.activo === 0) return false
  return true
}

// Horarios normalizados: array con dia_semana numérico (0-6), ordenados por dia_semana
const horariosNormalizados = computed(() => {
  const raw = horariosRestaurante.value
  if (!Array.isArray(raw) || raw.length === 0) return []
  return raw
    .map((x) => ({
      ...x,
      dia_semana: x.dia_semana != null ? Number(x.dia_semana) : -1
    }))
    .filter((x) => x.dia_semana >= 0 && x.dia_semana <= 7)
    .sort((a, b) => a.dia_semana - b.dia_semana)
})

// Horario configurado para la fecha seleccionada (según día de la semana)
// Acepta dia_semana 0-6 (Dom=0) o 1-7 (Lun=1, Dom=7) por compatibilidad; fallback por índice si hay 7 días ordenados
const horarioParaFechaSeleccionada = computed(() => {
  if (!form.value.fecha) return null
  const lista = horariosNormalizados.value
  if (!lista.length) return null

  const diaJs = diaSemanaDeFecha(form.value.fecha) // 0=Dom, 1=Lun, ... 6=Sab

  // 1) Buscar por coincidencia de dia_semana (0-6 o Dom=7)
  let h = lista.find((x) => {
    const d = x.dia_semana
    const coincide = d === diaJs || (diaJs === 0 && d === 7)
    return coincide && estaActivo(x)
  })

  // 2) Fallback: si hay 7 registros ordenados 0..6, el índice diaJs es el día
  if (!h && lista.length === 7 && lista[0]?.dia_semana === 0 && lista[6]?.dia_semana === 6) {
    const porIndice = lista[diaJs]
    if (porIndice && estaActivo(porIndice)) h = porIndice
  }

  return h || null
})

const diaCerrado = computed(() => {
  if (!form.value.fecha) return false
  // Si no hay horarios cargados, no bloquear (el backend validará)
  if (!horariosRestaurante.value?.length) return false
  return !horarioParaFechaSeleccionada.value
})

const esHoy = computed(() => form.value.fecha === new Date().toISOString().slice(0, 10))

// Hora mínima para reservar = apertura; si es hoy, al menos 2 h después de ahora (respetando horario)
const horaMin = computed(() => {
  const horario = horarioParaFechaSeleccionada.value
  const apertura = horario?.hora_apertura ? String(horario.hora_apertura).slice(0, 5) : null
  if (!apertura) return null

  const hoy = new Date().toISOString().slice(0, 10)
  if (form.value.fecha !== hoy) return apertura

  const now = new Date()
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const aperturaMin = parseInt(apertura.slice(0, 2), 10) * 60 + parseInt(apertura.slice(3, 5), 10)
  const now2Min = in2h.getHours() * 60 + in2h.getMinutes()
  const maxMin = Math.max(aperturaMin, now2Min)
  const hMax = Math.floor(maxMin / 60) % 24
  const mMax = maxMin % 60
  return `${String(hMax).padStart(2, '0')}:${String(mMax).padStart(2, '0')}`
})

// Hora máxima para iniciar reserva = cierre - 1h30 (HH:MM)
const horaMax = computed(() => {
  const h = horarioParaFechaSeleccionada.value?.hora_cierre
  if (!h) return null
  const [hour, min] = String(h).split(':').map(Number)
  const totalMin = (hour || 0) * 60 + (min || 0) - 90
  const h2 = Math.floor(totalMin / 60)
  const m2 = totalMin % 60
  return `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`
})

const montoAnticipoFormateado = computed(() => {
  if (montoAnticipo.value === null || montoAnticipo.value === '') return 'Sin monto configurado'
  const n = parseFloat(montoAnticipo.value)
  return isNaN(n) ? montoAnticipo.value : `$${n.toFixed(2)}`
})

// Nombre: solo letras (incl. acentos), espacios y apóstrofe; sin números (como en registro)
function limpiarNombreCliente(raw) {
  return (raw || '')
    .replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1' ]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart()
}

function onNombreClienteInput(event) {
  form.value.nombreCliente = limpiarNombreCliente(event.target.value)
}

function seleccionarPaisCliente(p) {
  paisCliente.value = p.codigo
  paisClienteOpen.value = false
  if (form.value.telefonoCliente) {
    onTelefonoClienteInput({ target: { value: form.value.telefonoCliente } })
  }
}

function onTelefonoClienteInput(event) {
  const max = paisSeleccionadoCliente.value.digitos
  let raw = (event.target.value || '').replace(/\D/g, '').slice(0, max)
  let formatted = raw
  if (max === 8 && raw.length > 4) {
    formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`
  } else if (max === 7 && raw.length > 3) {
    formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`
  }
  form.value.telefonoCliente = formatted
}

const puedeEnviar = computed(() => {
  if (diaCerrado.value) return false
  const tieneOpcion = form.value.opcionIndex !== '' || opcionesAsignacion.value.length === 1
  const datosBasicos = form.value.fecha && form.value.hora && tieneOpcion && form.value.cantidad_personas >= 1
  if (!datosBasicos) return false
  if (form.value.reservaPorLlamada) {
    const nombre = limpiarNombreCliente(form.value.nombreCliente).trim()
    const telefonoSoloDigitos = (form.value.telefonoCliente || '').replace(/\D/g, '')
    const digitosRequeridos = paisSeleccionadoCliente.value.digitos
    return nombre.length >= 2 && telefonoSoloDigitos.length === digitosRequeridos
  }
  return true
})

function textoOpcion(opcion) {
  if (!opcion?.mesas?.length) return ''
  if (opcion.tipo === 'simple') {
    return `Mesa ${opcion.mesas[0].numero_mesa} (${opcion.mesas[0].capacidad} pers.)`
  }
  const nombres = opcion.mesas.map(m => `Mesa ${m.numero_mesa}`).join(' + ')
  return `${nombres} (${opcion.capacidad_total} pers.)`
}

async function cargarParametrosReserva() {
  try {
    const [pMonto, pDias] = await Promise.all([
      parametrosApi.getByClave('monto_anticipo'),
      parametrosApi.getByClave('dias_anticipo_reserva_max')
    ])
    montoAnticipo.value = pMonto?.valor ?? ''
    const n = parseInt(pDias?.valor, 10)
    diasAnticipoReservaMax.value = Number.isFinite(n) && n >= 0 ? n : 4
  } catch {
    montoAnticipo.value = ''
    diasAnticipoReservaMax.value = 4
  }
}

async function cargarOpcionesAsignacion() {
  if (!form.value.fecha || !form.value.hora) {
    opcionesAsignacion.value = []
    return
  }
  if (diaCerrado.value) {
    opcionesAsignacion.value = []
    mensajeSinOpciones.value = 'El restaurante está cerrado ese día.'
    return
  }
  cargandoMesas.value = true
  form.value.opcionIndex = ''
  try {
    const hora = form.value.hora.length === 5 ? form.value.hora + ':00' : form.value.hora
    const res = await mesasApi.getOpcionesAsignacion({
      fecha: form.value.fecha,
      hora,
      cantidad_personas: form.value.cantidad_personas || 1,
      duracion: 120
    })
    const list = res?.opciones ?? (Array.isArray(res) ? res : [])
    opcionesAsignacion.value = list
    mensajeSinOpciones.value = res?.error || 'No hay mesas disponibles en ese horario. Pruebe otra fecha u hora.'
    // Auto-asignar si solo hay una opción (el cliente no tiene que elegir)
    if (list.length === 1) {
      form.value.opcionIndex = 0
    }
  } catch {
    opcionesAsignacion.value = []
    mensajeSinOpciones.value = 'No hay mesas disponibles en ese horario. Pruebe otra fecha u hora.'
  } finally {
    cargandoMesas.value = false
  }
}

// Si al elegir fecha aún no hay horarios, reintentar cargarlos (p. ej. si la primera petición falló)
watch(
  () => form.value.fecha,
  (nuevaFecha) => {
    if (nuevaFecha && horariosRestaurante.value.length === 0) {
      cargarHorarios()
    }
  }
)

watch(
  () => [form.value.fecha, form.value.hora, form.value.cantidad_personas],
  () => {
    if (form.value.fecha && diaCerrado.value) {
      opcionesAsignacion.value = []
      form.value.opcionIndex = ''
    }
    cargarOpcionesAsignacion()
  },
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
    // Si el cliente no seleccionó nada pero hay una sola opción, se usa esa (asignación automática)
    const idx = form.value.opcionIndex !== '' ? Number(form.value.opcionIndex) : (opcionesAsignacion.value.length === 1 ? 0 : -1)
    const opcion = opcionesAsignacion.value[idx]
    if (!opcion?.mesa_ids?.length) {
      error.value = opcionesAsignacion.value.length === 0 ? 'No hay mesas disponibles para este horario.' : 'Seleccione una opción de mesa'
      return
    }

    const payload = {
      mesa_ids: opcion.mesa_ids,
      fecha: form.value.fecha,
      hora: horaCompleta,
      cantidad_personas: form.value.cantidad_personas,
      duracion_estimada_minutos: 120,
      notas: form.value.notas || undefined,
      monto_anticipo: monto,
      metodo_pago_id: 1
    }
    if (form.value.reservaPorLlamada && authStore.esManager) {
      const nombreCliente = limpiarNombreCliente(form.value.nombreCliente).trim()
      const telefonoSoloDigitos = (form.value.telefonoCliente || '').replace(/\D/g, '')
      const pais = paisSeleccionadoCliente.value
      if (nombreCliente.length < 2) {
        error.value = 'El nombre del cliente debe tener al menos 2 letras (solo letras, sin números).'
        return
      }
      if (telefonoSoloDigitos.length !== pais.digitos) {
        error.value = `El teléfono para ${pais.nombre} debe tener exactamente ${pais.digitos} dígitos (sin prefijo).`
        return
      }
      payload.reserva_por_llamada = true
      payload.nombre_cliente = nombreCliente
      payload.telefono_cliente = pais.prefijo + telefonoSoloDigitos
      // No enviar usuario_id: el backend usará null y creado_por_id = manager
    } else {
      payload.usuario_id = authStore.user.id
      payload.creado_por_id = authStore.user.id
    }
    await reservasApi.create(payload)

    await reservasStore.fetchReservas(authStore.esManager ? {} : { usuario_id: authStore.user.id })
    invalidateMesasCache()
    router.push('/inicio')
  } catch (err) {
    error.value = err?.error || err?.message || 'Error al crear la reserva'
  } finally {
    loading.value = false
  }
}

async function cargarHorarios() {
  try {
    const res = await parametrosApi.getHorarios()
    // Aceptar array directo o { data: [...] } por compatibilidad
    const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])
    horariosRestaurante.value = list || []
  } catch {
    horariosRestaurante.value = []
  }
}

cargarParametrosReserva()
cargarHorarios()
</script>
