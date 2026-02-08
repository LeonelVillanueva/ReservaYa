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

              <!-- Símbolo de moneda -->
              <div v-if="p.clave === 'simbolo_moneda'" class="flex items-center gap-2 flex-1 min-w-0">
                <input
                  v-model="p.valorEdit"
                  type="text"
                  maxlength="5"
                  placeholder="Ej: L, $, €"
                  class="input bg-white w-20 text-sm py-1.5 text-center font-semibold"
                />
                <span class="text-xs text-gray-400">Se usará en precios y montos (Ej: L 100.00)</span>
              </div>

              <!-- Monto anticipo: numérico -->
              <div v-else-if="p.clave === 'monto_anticipo'" class="flex items-center gap-2 flex-1 min-w-0">
                <span class="text-xs text-gray-500 font-medium">{{ simboloMonedaActual }}</span>
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

    <!-- Sección de imágenes -->
    <div class="mt-1 flex-1 min-h-0 overflow-auto">
      <div class="card p-4">
        <h2 class="text-base font-semibold text-gray-900 mb-3">Imágenes del sistema</h2>
        <p class="text-xs text-gray-500 mb-4">Sube imágenes personalizadas para reemplazar las predeterminadas. Si no subes ninguna, se usarán las imágenes locales.</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Logo principal -->
          <div class="border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-3">
            <span class="text-xs font-medium text-gray-700">Logo principal</span>
            <div class="w-24 h-24 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              <img
                :src="imgLogoPreview || appImagesStore.logoUrl"
                alt="Logo principal"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="flex flex-col items-center gap-1.5 w-full">
              <label class="btn-primary text-xs cursor-pointer text-center w-full" :class="{ 'opacity-50 pointer-events-none': uploadingLogo }">
                {{ uploadingLogo ? 'Subiendo...' : 'Cambiar imagen' }}
                <input type="file" accept="image/*" class="hidden" @change="onUploadLogo" :disabled="uploadingLogo" />
              </label>
              <button
                v-if="appImagesStore.imagenes.imagen_logo_principal"
                type="button"
                class="text-xs text-red-500 hover:text-red-700 underline"
                @click="resetImagen('imagen_logo_principal', 'logo')"
              >
                Restaurar default
              </button>
            </div>
            <Transition name="img-alert">
              <Alert v-if="errorLogo" class="mt-1 w-full" variant="destructive" title="Error">{{ errorLogo }}</Alert>
            </Transition>
          </div>

          <!-- Logo letras -->
          <div class="border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-3">
            <span class="text-xs font-medium text-gray-700">Logo con letras</span>
            <div class="w-24 h-24 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              <img
                :src="imgLetrasPreview || appImagesStore.logoLetrasUrl"
                alt="Logo letras"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="flex flex-col items-center gap-1.5 w-full">
              <label class="btn-primary text-xs cursor-pointer text-center w-full" :class="{ 'opacity-50 pointer-events-none': uploadingLetras }">
                {{ uploadingLetras ? 'Subiendo...' : 'Cambiar imagen' }}
                <input type="file" accept="image/*" class="hidden" @change="onUploadLetras" :disabled="uploadingLetras" />
              </label>
              <button
                v-if="appImagesStore.imagenes.imagen_logo_letras"
                type="button"
                class="text-xs text-red-500 hover:text-red-700 underline"
                @click="resetImagen('imagen_logo_letras', 'letras')"
              >
                Restaurar default
              </button>
            </div>
            <Transition name="img-alert">
              <Alert v-if="errorLetras" class="mt-1 w-full" variant="destructive" title="Error">{{ errorLetras }}</Alert>
            </Transition>
          </div>

          <!-- Imagen mesa -->
          <div class="border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-3">
            <span class="text-xs font-medium text-gray-700">Imagen de mesa</span>
            <div class="w-24 h-24 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              <img
                :src="imgMesaPreview || appImagesStore.mesaUrl"
                alt="Imagen mesa"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="flex flex-col items-center gap-1.5 w-full">
              <label class="btn-primary text-xs cursor-pointer text-center w-full" :class="{ 'opacity-50 pointer-events-none': uploadingMesa }">
                {{ uploadingMesa ? 'Subiendo...' : 'Cambiar imagen' }}
                <input type="file" accept="image/*" class="hidden" @change="onUploadMesa" :disabled="uploadingMesa" />
              </label>
              <button
                v-if="appImagesStore.imagenes.imagen_mesa"
                type="button"
                class="text-xs text-red-500 hover:text-red-700 underline"
                @click="resetImagen('imagen_mesa', 'mesa')"
              >
                Restaurar default
              </button>
            </div>
            <Transition name="img-alert">
              <Alert v-if="errorMesa" class="mt-1 w-full" variant="destructive" title="Error">{{ errorMesa }}</Alert>
            </Transition>
          </div>
        </div>

        <Transition name="img-alert">
          <Alert v-if="successImagen" class="mt-3" variant="success" title="Listo">{{ successImagen }}</Alert>
        </Transition>
      </div>

      <!-- Sección del carrusel -->
      <div class="card p-4 mt-4">
        <h2 class="text-base font-semibold text-gray-900 mb-1">Carrusel de imágenes</h2>
        <p class="text-xs text-gray-500 mb-4">Administra las imágenes que se mostrarán en el carrusel de la página de inicio. Puedes agregar, eliminar y configurar el intervalo entre imágenes.</p>

        <!-- Configuración del intervalo -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <label class="text-xs font-medium text-gray-700">Intervalo entre imágenes:</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="carruselIntervaloLocal"
              type="number"
              min="1"
              max="30"
              step="1"
              class="input bg-white w-20 text-sm py-1.5 text-center"
            />
            <span class="text-xs text-gray-500">segundos</span>
          </div>
          <button
            type="button"
            class="btn-primary text-xs"
            :disabled="savingIntervalo || carruselIntervaloLocal === appImagesStore.carruselIntervalo"
            @click="guardarIntervalo"
          >
            {{ savingIntervalo ? 'Guardando...' : 'Aplicar' }}
          </button>
        </div>

        <!-- Agregar imágenes -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <label
            class="btn-primary text-xs cursor-pointer"
            :class="{ 'opacity-50 pointer-events-none': uploadingCarrusel || carruselLleno }"
          >
            {{ uploadingCarrusel ? `Subiendo (${carruselUploadProgress})...` : 'Agregar imágenes' }}
            <input
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onUploadCarrusel"
              :disabled="uploadingCarrusel || carruselLleno"
            />
          </label>
          <span class="text-xs" :class="carruselLleno ? 'text-amber-600 font-medium' : 'text-gray-500'">
            {{ appImagesStore.carruselImagenes.length }} de {{ appImagesStore.maxCarrusel }}
            <template v-if="!carruselLleno"> &mdash; {{ espaciosCarrusel }} espacio(s) disponible(s)</template>
            <template v-else> &mdash; Carrusel lleno</template>
          </span>
        </div>

        <Transition name="img-alert">
          <Alert v-if="errorCarrusel" class="mb-3" variant="destructive" title="Error">{{ errorCarrusel }}</Alert>
        </Transition>
        <Transition name="img-alert">
          <Alert v-if="successCarrusel" class="mb-3" variant="success" title="Listo">{{ successCarrusel }}</Alert>
        </Transition>

        <!-- Lista de imágenes del carrusel -->
        <div v-if="appImagesStore.carruselImagenes.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div
            v-for="(url, idx) in appImagesStore.carruselImagenes"
            :key="idx"
            class="relative group border border-gray-200 rounded-lg overflow-hidden"
          >
            <img :src="url" alt="Imagen carrusel" class="w-full h-24 object-cover" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                class="bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow text-xs"
                title="Eliminar imagen"
                @click="eliminarImagenCarrusel(idx)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <span class="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">{{ idx + 1 }}</span>
          </div>
        </div>
        <p v-else class="text-xs text-gray-400 italic">No hay imágenes en el carrusel. Agrega algunas para que se muestren en la página de inicio.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Alert from '@/components/ui/Alert.vue'
import { parametrosApi, storageApi } from '@/api'
import { useAppImagesStore } from '@/stores/appImages'

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

const simboloMonedaActual = computed(() => {
  const p = parametros.value.find(x => x.clave === 'simbolo_moneda')
  return p?.valorEdit || 'L'
})

const labelsParametros = {
  monto_anticipo: 'Monto de anticipo',
  horas_anticipo_cancelacion: 'Horas de anticipo para cancelar',
  devolver_anticipo_si_cancela: 'Devolver anticipo si cancela (sí/no)',
  dias_anticipo_reserva_max: 'Días máximos para reservar con anticipación',
  simbolo_moneda: 'Símbolo de moneda',
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

// Parámetros que deben existir siempre con sus valores por defecto
const PARAMETROS_DEFAULTS = {
  simbolo_moneda: 'L',
}

async function cargarParametros() {
  loadingParams.value = true
  errorParams.value = ''
  try {
    const data = await parametrosApi.getAll()
    const lista = (data || [])
      .filter((p) => !p.clave.startsWith('imagen_') && !p.clave.startsWith('carrusel_'))
      .map((p) => ({
        ...p,
        valorEdit: p.valor != null ? String(p.valor) : '',
      }))

    // Agregar parámetros por defecto si no existen en la BD
    for (const [clave, valorDefault] of Object.entries(PARAMETROS_DEFAULTS)) {
      if (!lista.find((p) => p.clave === clave)) {
        lista.push({ clave, valor: valorDefault, valorEdit: valorDefault })
      }
    }

    parametros.value = lista
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

// === Gestión de imágenes ===
const appImagesStore = useAppImagesStore()

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const uploadingLogo = ref(false)
const uploadingLetras = ref(false)
const uploadingMesa = ref(false)
const errorLogo = ref('')
const errorLetras = ref('')
const errorMesa = ref('')
const imgLogoPreview = ref(null)
const imgLetrasPreview = ref(null)
const imgMesaPreview = ref(null)
const successImagen = ref('')

function clearSuccessImagen() {
  setTimeout(() => { successImagen.value = '' }, 3000)
}

function validarArchivo(file) {
  if (!file) return 'No se seleccionó ningún archivo'
  if (!TIPOS_PERMITIDOS.includes(file.type)) return 'Tipo no permitido. Use JPG, PNG, WebP o GIF.'
  if (file.size > MAX_SIZE) return 'El archivo excede los 5 MB permitidos.'
  return null
}

async function subirImagen(folder, file) {
  const response = await storageApi.upload(folder, file)
  // response ya es response.data gracias al interceptor de axios
  return response?.data?.url || response?.url || null
}

async function onUploadLogo(event) {
  const file = event.target.files?.[0]
  if (!file) return
  errorLogo.value = ''
  const errorValidacion = validarArchivo(file)
  if (errorValidacion) { errorLogo.value = errorValidacion; event.target.value = ''; return }
  uploadingLogo.value = true
  imgLogoPreview.value = URL.createObjectURL(file)
  try {
    const oldUrl = appImagesStore.imagenes.imagen_logo_principal
    const url = await subirImagen('restaurante', file)
    if (!url) throw new Error('No se recibió URL del servidor')
    await appImagesStore.guardar('imagen_logo_principal', url)
    // Eliminar la imagen anterior del bucket
    if (oldUrl) await storageApi.deleteByUrl(oldUrl)
    successImagen.value = 'Logo principal actualizado.'
    clearSuccessImagen()
  } catch (err) {
    errorLogo.value = err?.error || err?.message || 'Error al subir la imagen'
  } finally {
    uploadingLogo.value = false
    imgLogoPreview.value = null
    event.target.value = ''
  }
}

async function onUploadLetras(event) {
  const file = event.target.files?.[0]
  if (!file) return
  errorLetras.value = ''
  const errorValidacion = validarArchivo(file)
  if (errorValidacion) { errorLetras.value = errorValidacion; event.target.value = ''; return }
  uploadingLetras.value = true
  imgLetrasPreview.value = URL.createObjectURL(file)
  try {
    const oldUrl = appImagesStore.imagenes.imagen_logo_letras
    const url = await subirImagen('restaurante', file)
    if (!url) throw new Error('No se recibió URL del servidor')
    await appImagesStore.guardar('imagen_logo_letras', url)
    if (oldUrl) await storageApi.deleteByUrl(oldUrl)
    successImagen.value = 'Logo con letras actualizado.'
    clearSuccessImagen()
  } catch (err) {
    errorLetras.value = err?.error || err?.message || 'Error al subir la imagen'
  } finally {
    uploadingLetras.value = false
    imgLetrasPreview.value = null
    event.target.value = ''
  }
}

async function onUploadMesa(event) {
  const file = event.target.files?.[0]
  if (!file) return
  errorMesa.value = ''
  const errorValidacion = validarArchivo(file)
  if (errorValidacion) { errorMesa.value = errorValidacion; event.target.value = ''; return }
  uploadingMesa.value = true
  imgMesaPreview.value = URL.createObjectURL(file)
  try {
    const oldUrl = appImagesStore.imagenes.imagen_mesa
    const url = await subirImagen('restaurante', file)
    if (!url) throw new Error('No se recibió URL del servidor')
    await appImagesStore.guardar('imagen_mesa', url)
    if (oldUrl) await storageApi.deleteByUrl(oldUrl)
    successImagen.value = 'Imagen de mesa actualizada.'
    clearSuccessImagen()
  } catch (err) {
    errorMesa.value = err?.error || err?.message || 'Error al subir la imagen'
  } finally {
    uploadingMesa.value = false
    imgMesaPreview.value = null
    event.target.value = ''
  }
}

async function resetImagen(clave, tipo) {
  try {
    const oldUrl = appImagesStore.imagenes[clave]
    await appImagesStore.guardar(clave, null)
    // Eliminar la imagen del bucket al restaurar default
    if (oldUrl) await storageApi.deleteByUrl(oldUrl)
    successImagen.value = `Imagen de ${tipo} restaurada al default.`
    clearSuccessImagen()
  } catch (err) {
    console.error('Error al restaurar imagen:', err)
  }
}

// === Gestión del carrusel ===
const carruselIntervaloLocal = ref(appImagesStore.carruselIntervalo)
const uploadingCarrusel = ref(false)
const savingIntervalo = ref(false)
const errorCarrusel = ref('')
const successCarrusel = ref('')
const carruselUploadProgress = ref('')

const carruselLleno = computed(() => appImagesStore.carruselImagenes.length >= appImagesStore.maxCarrusel)
const espaciosCarrusel = computed(() => appImagesStore.maxCarrusel - appImagesStore.carruselImagenes.length)

function clearSuccessCarrusel() {
  setTimeout(() => { successCarrusel.value = '' }, 3000)
}

async function guardarIntervalo() {
  savingIntervalo.value = true
  errorCarrusel.value = ''
  try {
    await appImagesStore.setIntervaloCarrusel(carruselIntervaloLocal.value)
    successCarrusel.value = 'Intervalo actualizado.'
    clearSuccessCarrusel()
  } catch (err) {
    errorCarrusel.value = err?.error || err?.message || 'Error al guardar intervalo'
  } finally {
    savingIntervalo.value = false
  }
}

async function onUploadCarrusel(event) {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return
  errorCarrusel.value = ''

  // Validar cantidad disponible
  const disponibles = espaciosCarrusel.value
  if (files.length > disponibles) {
    errorCarrusel.value = `Solo puedes agregar ${disponibles} imagen(es) más (máximo ${appImagesStore.maxCarrusel}).`
    event.target.value = ''
    return
  }

  // Validar cada archivo
  for (const file of files) {
    const errorValidacion = validarArchivo(file)
    if (errorValidacion) {
      errorCarrusel.value = `${file.name}: ${errorValidacion}`
      event.target.value = ''
      return
    }
  }

  uploadingCarrusel.value = true
  const urls = []
  try {
    for (let i = 0; i < files.length; i++) {
      carruselUploadProgress.value = `${i + 1}/${files.length}`
      const url = await subirImagen('restaurante', files[i])
      if (!url) throw new Error(`No se recibió URL para ${files[i].name}`)
      urls.push(url)
    }
    await appImagesStore.agregarImagenesCarrusel(urls)
    successCarrusel.value = urls.length === 1
      ? 'Imagen agregada al carrusel.'
      : `${urls.length} imágenes agregadas al carrusel.`
    clearSuccessCarrusel()
  } catch (err) {
    errorCarrusel.value = err?.error || err?.message || 'Error al subir las imágenes'
  } finally {
    uploadingCarrusel.value = false
    carruselUploadProgress.value = ''
    event.target.value = ''
  }
}

async function eliminarImagenCarrusel(index) {
  errorCarrusel.value = ''
  try {
    const url = appImagesStore.carruselImagenes[index]
    await appImagesStore.eliminarImagenCarrusel(index)
    // Eliminar la imagen del bucket
    if (url) await storageApi.deleteByUrl(url)
    successCarrusel.value = 'Imagen eliminada del carrusel.'
    clearSuccessCarrusel()
  } catch (err) {
    errorCarrusel.value = err?.error || err?.message || 'Error al eliminar la imagen'
  }
}

onMounted(() => {
  cargarParametros()
  cargarHorarios()
  // Sincronizar el valor local del intervalo con el store
  carruselIntervaloLocal.value = appImagesStore.carruselIntervalo
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
.img-alert-enter-active,
.img-alert-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.img-alert-enter-from,
.img-alert-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
