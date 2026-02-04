<template>
  <div class="config-page">
    <div class="config-header">
      <h1 class="text-xl font-bold text-gray-900">Configuraciones</h1>
      <p class="text-gray-600 text-sm">Parámetros del sistema y horarios del restaurante.</p>
    </div>

    <div
      ref="resizeContainerRef"
      class="config-resize-container"
      :style="{ flex: `0 0 ${contentHeightPct}%` }"
    >
      <!-- Panel izquierdo: Parámetros -->
      <div class="config-panel config-panel-left" :style="{ width: leftPanelWidth + '%' }">
        <div class="config-panel-inner card">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Parámetros del sistema</h2>
          <div v-if="loadingParams" class="text-gray-500 py-3 text-sm">Cargando...</div>
          <div v-else-if="parametros.length === 0" class="text-gray-500 py-3 text-sm">No hay parámetros.</div>
          <form v-else class="space-y-2" @submit.prevent="guardarParametros">
            <div
              v-for="p in parametros"
              :key="p.clave"
              class="flex flex-wrap items-center gap-2 py-1.5 border-b border-gray-100 last:border-0"
            >
              <label class="w-full sm:w-40 text-xs font-medium text-gray-700 shrink-0">
                {{ labelParametro(p.clave) }}
              </label>

              <!-- Monto anticipo: numérico en LPS -->
              <div v-if="p.clave === 'monto_anticipo'" class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-xs text-gray-500 font-medium">LPS</span>
                <input
                  v-model="p.valorEdit"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input bg-white flex-1 min-w-0 text-sm py-1.5"
                />
              </div>

              <!-- Devolver anticipo: checkbox Sí/No -->
              <div v-else-if="p.clave === 'devolver_anticipo_si_cancela'" class="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                  :checked="p.valorEdit === 'true'"
                  @change="p.valorEdit = $event.target.checked ? 'true' : 'false'"
                />
                <span class="text-xs text-gray-600">Devolver anticipo si cumple condiciones</span>
              </div>

              <!-- Horas anticipo cancelación: numérico -->
              <div v-else-if="p.clave === 'horas_anticipo_cancelacion'" class="flex items-center gap-2 flex-1 min-w-0">
                <input
                  v-model="p.valorEdit"
                  type="number"
                  min="0"
                  step="1"
                  class="input bg-white flex-1 min-w-0 text-sm py-1.5"
                />
                <span class="text-xs text-gray-500 whitespace-nowrap">horas</span>
              </div>

              <!-- Resto de parámetros: texto genérico -->
              <input
                v-else
                v-model="p.valorEdit"
                type="text"
                class="input bg-white flex-1 min-w-0 text-sm py-1.5"
              />
            </div>
            <div class="pt-2">
              <button type="submit" class="btn-primary text-sm" :disabled="savingParams">
                {{ savingParams ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
          <Alert v-if="errorParams" class="mt-3 text-sm" variant="destructive" title="Error">
            {{ errorParams }}
          </Alert>
          <p v-if="successParams" class="mt-2 text-xs text-green-600">Guardado.</p>
        </div>
      </div>

      <!-- Divisor arrastrable -->
      <div
        class="config-resizer"
        :class="{ 'config-resizer-active': isDragging }"
        @mousedown.prevent="startDrag"
      >
        <span class="config-resizer-handle" />
      </div>

      <!-- Panel derecho: Horarios -->
      <div class="config-panel config-panel-right">
        <div class="config-panel-inner card">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Horarios del restaurante</h2>
          <div v-if="loadingHorarios" class="text-gray-500 py-3 text-sm">Cargando...</div>
          <form v-else @submit.prevent="guardarHorarios">
            <div class="flex flex-col gap-0.5">
              <div class="grid grid-cols-[4rem_1fr_1fr_2.25rem] items-center gap-2 py-1 px-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <span>Día</span>
                <span>Apertura</span>
                <span>Cierre</span>
                <span class="text-center" title="Abierto">✓</span>
              </div>
              <div
                v-for="h in horariosOrdenados"
                :key="h.dia_semana"
                class="grid grid-cols-[4rem_1fr_1fr_2.25rem] items-center gap-2 py-1 px-2 rounded hover:bg-gray-50/80"
              >
                <span class="text-xs font-medium text-gray-700 truncate">{{ nombreDiaCorto(h.dia_semana) }}</span>
                <input
                  v-model="h.hora_apertura"
                  type="time"
                  class="input bg-white py-1 px-2 text-xs w-full min-w-0"
                  :disabled="!h.activo"
                />
                <input
                  v-model="h.hora_cierre"
                  type="time"
                  class="input bg-white py-1 px-2 text-xs w-full min-w-0"
                  :disabled="!h.activo"
                />
                <label class="flex items-center justify-center cursor-pointer" title="Abierto">
                  <input
                    v-model="h.activo"
                    type="checkbox"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                  />
                </label>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <button type="submit" class="btn-primary text-sm" :disabled="savingHorarios">
                {{ savingHorarios ? 'Guardando...' : 'Guardar' }}
              </button>
              <button
                type="button"
                class="text-xs text-gray-600 hover:text-gray-800 underline"
                @click="aplicarMismoHorario"
              >
                Mismo horario a todos
              </button>
            </div>
          </form>
          <Alert v-if="errorHorarios" class="mt-2 text-sm" variant="destructive" title="Error">
            {{ errorHorarios }}
          </Alert>
          <p v-if="successHorarios" class="mt-1 text-xs text-green-600">Guardado.</p>
        </div>
      </div>
    </div>

    <!-- Resizer vertical: barra abajo; arrastrar hacia arriba/abajo cambia la altura del área de contenido -->
    <div
      class="config-resizer-h"
      :class="{ 'config-resizer-active': isDraggingH }"
      @mousedown.prevent="startDragH"
    >
      <span class="config-resizer-handle-h" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Alert from '@/components/ui/Alert.vue'
import { parametrosApi } from '@/api'

const MIN_PANEL_PCT = 25
const MAX_PANEL_PCT = 75
const DEFAULT_LEFT_PCT = 50
const MIN_CONTENT_PCT = 30
const MAX_CONTENT_PCT = 100
const DEFAULT_CONTENT_PCT = 88

function getInitialLeftPanelWidth() {
  try {
    const stored = localStorage.getItem('config_left_panel_width_pct')
    const n = stored != null ? Number(stored) : NaN
    if (!Number.isNaN(n)) {
      return Math.min(MAX_PANEL_PCT, Math.max(MIN_PANEL_PCT, n))
    }
  } catch {}
  return DEFAULT_LEFT_PCT
}

function getInitialContentHeightPct() {
  try {
    const stored = localStorage.getItem('config_content_height_pct')
    const n = stored != null ? Number(stored) : NaN
    if (!Number.isNaN(n)) {
      return Math.min(MAX_CONTENT_PCT, Math.max(MIN_CONTENT_PCT, n))
    }
  } catch {}
  return DEFAULT_CONTENT_PCT
}

const leftPanelWidth = ref(getInitialLeftPanelWidth())
const contentHeightPct = ref(getInitialContentHeightPct())
const isDragging = ref(false)
const isDraggingH = ref(false)
const resizeContainerRef = ref(null)

function persistLayout() {
  try {
    localStorage.setItem('config_left_panel_width_pct', String(leftPanelWidth.value))
    localStorage.setItem('config_content_height_pct', String(contentHeightPct.value))
  } catch {}
}

function startDrag() {
  isDragging.value = true
}

function startDragH() {
  isDraggingH.value = true
}

function onMouseMove(e) {
  if (isDraggingH.value) {
    const pageRef = document.querySelector('.config-page')
    if (!pageRef) return
    const rect = pageRef.getBoundingClientRect()
    const y = e.clientY - rect.top
    const pct = Math.round((y / rect.height) * 100)
    contentHeightPct.value = Math.min(MAX_CONTENT_PCT, Math.max(MIN_CONTENT_PCT, pct))
    return
  }
  if (!isDragging.value || !resizeContainerRef.value) return
  const rect = resizeContainerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const pct = Math.round((x / rect.width) * 100)
  leftPanelWidth.value = Math.min(MAX_PANEL_PCT, Math.max(MIN_PANEL_PCT, pct))
}

function onMouseUp() {
  isDragging.value = false
  isDraggingH.value = false
  persistLayout()
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

const parametros = ref([])
const loadingParams = ref(true)
const savingParams = ref(false)
const errorParams = ref('')
const successParams = ref(false)

const horarios = ref([])
const loadingHorarios = ref(true)
const savingHorarios = ref(false)
const errorHorarios = ref('')
const successHorarios = ref(false)

const DIAS_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const labelsParametros = {
  monto_anticipo: 'Monto de anticipo',
  horas_anticipo_cancelacion: 'Horas de anticipo para cancelar',
  devolver_anticipo_si_cancela: 'Devolver anticipo si cancela (sí/no)',
  dias_anticipo_reserva_max: 'Días máximos para reservar con anticipación',
}

function labelParametro(clave) {
  return labelsParametros[clave] || clave
}

const horariosOrdenados = computed(() => {
  const list = [...horarios.value]
  return list.sort((a, b) => (a.dia_semana ?? 0) - (b.dia_semana ?? 0))
})

function nombreDia(diaSemana) {
  return DIAS_NOMBRES[diaSemana] ?? `Día ${diaSemana}`
}

function nombreDiaCorto(diaSemana) {
  return DIAS_CORTOS[diaSemana] ?? String(diaSemana)
}

function aplicarMismoHorario() {
  const primero = horariosOrdenados.value[0]
  if (!primero) return
  const apertura = primero.hora_apertura || '09:00'
  const cierre = primero.hora_cierre || '22:00'
  horarios.value = horarios.value.map((h) => ({
    ...h,
    hora_apertura: apertura,
    hora_cierre: cierre,
  }))
}

async function cargarParametros() {
  loadingParams.value = true
  errorParams.value = ''
  try {
    const data = await parametrosApi.getAll()
    parametros.value = (data || []).map((p) => ({
      ...p,
      valorEdit: p.valor != null ? String(p.valor) : '',
    }))
  } catch (err) {
    errorParams.value = err?.error || err?.message || 'Error al cargar parámetros'
  } finally {
    loadingParams.value = false
  }
}

async function guardarParametros() {
  savingParams.value = true
  errorParams.value = ''
  successParams.value = false
  try {
    for (const p of parametros.value) {
      await parametrosApi.update(p.clave, p.valorEdit)
    }
    successParams.value = true
  } catch (err) {
    errorParams.value = err?.error || err?.message || 'Error al guardar'
  } finally {
    savingParams.value = false
  }
}

async function cargarHorarios() {
  loadingHorarios.value = true
  errorHorarios.value = ''
  try {
    const data = await parametrosApi.getHorarios()
    if (Array.isArray(data) && data.length > 0) {
      horarios.value = data.map((h) => ({
        ...h,
        activo: !!h.activo,
        hora_apertura: (h.hora_apertura || '').slice(0, 5),
        hora_cierre: (h.hora_cierre || '').slice(0, 5),
      }))
    } else {
      horarios.value = DIAS_NOMBRES.map((_, i) => ({
        dia_semana: i,
        hora_apertura: '09:00',
        hora_cierre: '22:00',
        activo: i !== 0,
      }))
    }
  } catch (err) {
    errorHorarios.value = err?.error || err?.message || 'Error al cargar horarios'
  } finally {
    loadingHorarios.value = false
  }
}

async function guardarHorarios() {
  savingHorarios.value = true
  errorHorarios.value = ''
  successHorarios.value = false
  try {
    const payload = horariosOrdenados.value.map((h) => ({
      dia_semana: h.dia_semana,
      hora_apertura: h.hora_apertura || null,
      hora_cierre: h.hora_cierre || null,
      activo: !!h.activo,
    }))
    await parametrosApi.updateHorarios(payload)
    successHorarios.value = true
  } catch (err) {
    errorHorarios.value = err?.error || err?.message || 'Error al guardar horarios'
  } finally {
    savingHorarios.value = false
  }
}

onMounted(() => {
  cargarParametros()
  cargarHorarios()
})
</script>

<style scoped>
.config-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  min-height: 0;
}
.config-header {
  flex-shrink: 0;
  padding: 0.25rem 0;
}
.config-resize-container {
  flex-shrink: 0;
  min-height: 10rem;
  display: flex;
  gap: 0;
}
.config-resizer-h {
  flex-shrink: 0;
  height: 8px;
  cursor: row-resize;
  background: linear-gradient(to bottom, transparent 2px, #e5e7eb 2px, #e5e7eb 3px, transparent 3px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.config-resizer-h:hover,
.config-resizer-h.config-resizer-active {
  background: rgb(237 117 26 / 0.25);
}
.config-resizer-handle-h {
  width: 2rem;
  height: 4px;
  border-radius: 2px;
  background: rgb(156 163 175);
  opacity: 0.6;
}
.config-resizer-h:hover .config-resizer-handle-h,
.config-resizer-h.config-resizer-active .config-resizer-handle-h {
  background: rgb(237 117 26);
  opacity: 1;
}
.config-panel {
  min-width: 0;
  overflow: auto;
}
.config-panel-left {
  flex-shrink: 0;
}
.config-panel-right {
  flex: 1;
  min-width: 0;
}
.config-panel-inner {
  height: 100%;
  padding: 1rem;
  min-height: min-content;
}
.config-resizer {
  flex-shrink: 0;
  width: 8px;
  cursor: col-resize;
  background: linear-gradient(to right, transparent 2px, var(--tw-gray-200, #e5e7eb) 2px, var(--tw-gray-200, #e5e7eb) 3px, transparent 3px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.config-resizer:hover,
.config-resizer-active {
  background: rgb(237 117 26 / 0.2);
}
.config-resizer-handle {
  width: 4px;
  height: 2rem;
  border-radius: 2px;
  background: rgb(156 163 175);
  opacity: 0.6;
}
.config-resizer:hover .config-resizer-handle,
.config-resizer-active .config-resizer-handle {
  background: rgb(237 117 26);
  opacity: 1;
}
</style>
