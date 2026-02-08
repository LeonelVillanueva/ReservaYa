<template>
  <div class="p-6 max-w-5xl">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-gray-900">Revisión de comprobantes</h1>
      <p class="text-sm text-gray-500 mt-1">Comprobantes de transferencia pendientes de aprobación manual.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-gray-500 text-sm py-8 text-center">
      Cargando comprobantes pendientes...
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
      {{ errorMsg }}
    </div>

    <!-- Sin pendientes -->
    <div v-else-if="pendientes.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-gray-500 text-sm font-medium">No hay comprobantes pendientes</p>
      <p class="text-gray-400 text-xs mt-1">Todos los comprobantes han sido revisados.</p>
    </div>

    <!-- Lista de comprobantes pendientes -->
    <div v-else class="space-y-4">
      <div
        v-for="pago in pendientes"
        :key="pago.id"
        class="card border border-gray-200 overflow-hidden"
      >
        <div class="flex flex-col lg:flex-row">
          <!-- Imagen del comprobante -->
          <div class="lg:w-80 shrink-0 bg-gray-50 p-4 flex items-center justify-center">
            <img
              v-if="pago.comprobante_url"
              :src="pago.comprobante_url"
              alt="Comprobante"
              class="max-h-72 w-full object-contain rounded-lg cursor-pointer hover:opacity-90 transition"
              @click="abrirImagen(pago.comprobante_url)"
            />
            <div v-else class="text-center text-gray-400 py-8">
              <svg class="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-xs">Sin imagen</p>
            </div>
          </div>

          <!-- Datos del pago y reserva -->
          <div class="flex-1 p-5">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-gray-900">
                  Pago #{{ pago.id }} — Reserva #{{ pago.reserva?.id }}
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ pago.reserva?.reserva_por_llamada
                    ? `Cliente: ${pago.reserva.nombre_cliente} (${pago.reserva.telefono_cliente})`
                    : `${pago.reserva?.usuario?.nombre || ''} ${pago.reserva?.usuario?.apellido || ''} — ${pago.reserva?.usuario?.email || ''}`.trim()
                  }}
                </p>
              </div>
              <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                Pendiente
              </span>
            </div>

            <!-- Info de la reserva -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <p class="text-[10px] text-gray-400 uppercase font-medium">Monto</p>
                <p class="text-sm font-bold text-primary-700">{{ formatMonto(pago.monto) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 uppercase font-medium">Fecha reserva</p>
                <p class="text-xs text-gray-700">{{ pago.reserva?.fecha || '—' }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 uppercase font-medium">Hora</p>
                <p class="text-xs text-gray-700">{{ pago.reserva?.hora?.slice(0, 5) || '—' }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 uppercase font-medium">Personas</p>
                <p class="text-xs text-gray-700">{{ pago.reserva?.cantidad_personas || '—' }}</p>
              </div>
            </div>

            <!-- Datos OCR extraídos -->
            <div v-if="pago.ocr_resultado" class="mb-4 space-y-3">
              <!-- Motivo principal de rechazo -->
              <div v-if="pago.ocr_resultado.motivo_rechazo" class="rounded-lg bg-red-50 border border-red-200 p-3">
                <p class="text-[10px] text-red-400 uppercase font-bold mb-1">Motivo de rechazo OCR</p>
                <p class="text-xs text-red-700 font-medium">{{ pago.ocr_resultado.motivo_rechazo }}</p>
              </div>

              <!-- Datos extraídos -->
              <div class="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <p class="text-[10px] text-gray-400 uppercase font-medium mb-2">Datos extraídos por OCR</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span class="text-gray-500">Monto detectado:</span>
                    <span class="ml-1 font-medium" :class="pago.ocr_resultado.datos_extraidos?.monto ? 'text-gray-800' : 'text-red-400'">
                      {{ pago.ocr_resultado.datos_extraidos?.monto ?? 'No detectado' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Fecha:</span>
                    <span class="ml-1 font-medium" :class="pago.ocr_resultado.datos_extraidos?.fecha ? 'text-gray-800' : 'text-red-400'">
                      {{ pago.ocr_resultado.datos_extraidos?.fecha ?? 'No detectada' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Referencia:</span>
                    <span class="ml-1 font-medium" :class="pago.ocr_resultado.datos_extraidos?.referencia ? 'text-gray-800' : 'text-red-400'">
                      {{ pago.ocr_resultado.datos_extraidos?.referencia ?? 'No detectada' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Confianza OCR:</span>
                    <span class="ml-1 font-bold" :class="(pago.ocr_resultado.confianza || 0) >= 0.7 ? 'text-emerald-600' : 'text-red-600'">
                      {{ Math.round((pago.ocr_resultado.confianza || 0) * 100) }}%
                    </span>
                    <span class="text-gray-400 ml-1">· {{ pago.intentos_verificacion || 0 }} intentos</span>
                  </div>
                </div>
              </div>

              <!-- Análisis de imagen (autenticidad) -->
              <div v-if="pago.ocr_resultado.analisis_imagen" class="rounded-lg border p-3"
                :class="pago.ocr_resultado.analisis_imagen.sospechosa ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[10px] uppercase font-bold"
                    :class="pago.ocr_resultado.analisis_imagen.sospechosa ? 'text-red-500' : 'text-emerald-500'">
                    Análisis de imagen
                  </span>
                  <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    :class="pago.ocr_resultado.analisis_imagen.sospechosa ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'">
                    {{ pago.ocr_resultado.analisis_imagen.sospechosa ? 'SOSPECHOSA' : 'OK' }}
                    · {{ Math.round((pago.ocr_resultado.analisis_imagen.puntuacion || 0) * 100) }}%
                  </span>
                </div>
                <ul v-if="pago.ocr_resultado.analisis_imagen.razones?.length" class="space-y-1">
                  <li v-for="(razon, i) in pago.ocr_resultado.analisis_imagen.razones" :key="i"
                    class="text-[11px] text-red-700 flex items-start gap-1.5">
                    <svg class="w-3 h-3 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    {{ razon }}
                  </li>
                </ul>
                <p v-else class="text-[11px] text-emerald-700">Sin problemas detectados en la imagen.</p>
                <p v-if="pago.ocr_resultado.analisis_imagen.software_edicion" class="text-[11px] text-red-700 mt-1 font-semibold">
                  Software de edición detectado: {{ pago.ocr_resultado.analisis_imagen.software_edicion }}
                </p>
              </div>

              <!-- Estructura bancaria -->
              <div v-if="pago.ocr_resultado.estructura_bancaria" class="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p class="text-[10px] text-slate-400 uppercase font-bold mb-2">Estructura bancaria</p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span class="text-gray-500">Banco:</span>
                    <span class="ml-1 font-medium" :class="pago.ocr_resultado.estructura_bancaria.banco_detectado ? 'text-gray-800' : 'text-red-400'">
                      {{ pago.ocr_resultado.estructura_bancaria.banco_detectado || 'No detectado' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Palabras clave:</span>
                    <span class="ml-1 font-medium text-gray-800">
                      {{ pago.ocr_resultado.estructura_bancaria.palabras_clave || 0 }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Cuentas detectadas:</span>
                    <span class="ml-1 font-medium text-gray-800">
                      {{ pago.ocr_resultado.estructura_bancaria.cuentas_detectadas || 0 }}
                    </span>
                  </div>
                  <div>
                    <span class="text-gray-500">Estructura OK:</span>
                    <span class="ml-1 font-bold" :class="pago.ocr_resultado.estructura_bancaria.estructura_ok ? 'text-emerald-600' : 'text-red-500'">
                      {{ pago.ocr_resultado.estructura_bancaria.estructura_ok ? 'Sí' : 'No' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Consistencia de texto -->
              <div v-if="pago.ocr_resultado.consistencia_texto" class="rounded-lg border p-3"
                :class="pago.ocr_resultado.consistencia_texto.consistente ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[10px] uppercase font-bold"
                    :class="pago.ocr_resultado.consistencia_texto.consistente ? 'text-emerald-500' : 'text-amber-500'">
                    Consistencia de texto
                  </span>
                  <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    :class="pago.ocr_resultado.consistencia_texto.consistente ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                    {{ pago.ocr_resultado.consistencia_texto.consistente ? 'CONSISTENTE' : 'INCONSISTENTE' }}
                    · {{ Math.round((pago.ocr_resultado.consistencia_texto.puntuacion || 0) * 100) }}%
                  </span>
                </div>
                <ul v-if="pago.ocr_resultado.consistencia_texto.razones?.length" class="space-y-1">
                  <li v-for="(razon, i) in pago.ocr_resultado.consistencia_texto.razones" :key="i"
                    class="text-[11px] text-amber-700 flex items-start gap-1.5">
                    <svg class="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    {{ razon }}
                  </li>
                </ul>
                <p v-else class="text-[11px] text-emerald-700">Texto uniforme y consistente.</p>
              </div>

              <!-- Segunda barrera (pHash, duplicados, riesgo) -->
              <div v-if="pago.ocr_resultado.segunda_barrera" class="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                <p class="text-[10px] text-indigo-400 uppercase font-bold mb-2">Segunda barrera de seguridad</p>
                <div class="space-y-2 text-xs">
                  <!-- Imagen duplicada -->
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full shrink-0" :class="pago.ocr_resultado.segunda_barrera.imagen_duplicada ? 'bg-red-500' : 'bg-emerald-500'"></span>
                    <span class="text-gray-700">Imagen duplicada:</span>
                    <span class="font-bold" :class="pago.ocr_resultado.segunda_barrera.imagen_duplicada ? 'text-red-700' : 'text-emerald-700'">
                      {{ pago.ocr_resultado.segunda_barrera.imagen_duplicada ? 'SÍ' : 'No' }}
                    </span>
                    <span v-if="pago.ocr_resultado.segunda_barrera.imagen_duplicada_de" class="text-red-500 text-[11px]">
                      (similar a pago #{{ pago.ocr_resultado.segunda_barrera.imagen_duplicada_de }})
                    </span>
                  </div>
                  <!-- Referencia duplicada -->
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full shrink-0" :class="pago.ocr_resultado.segunda_barrera.referencia_duplicada ? 'bg-red-500' : 'bg-emerald-500'"></span>
                    <span class="text-gray-700">Referencia duplicada:</span>
                    <span class="font-bold" :class="pago.ocr_resultado.segunda_barrera.referencia_duplicada ? 'text-red-700' : 'text-emerald-700'">
                      {{ pago.ocr_resultado.segunda_barrera.referencia_duplicada ? 'SÍ' : 'No' }}
                    </span>
                  </div>
                  <!-- Riesgo del usuario -->
                  <div v-if="pago.ocr_resultado.segunda_barrera.riesgo_usuario" class="mt-2 pt-2 border-t border-indigo-200">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-gray-700">Riesgo del usuario:</span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        :class="{
                          'bg-emerald-100 text-emerald-700': pago.ocr_resultado.segunda_barrera.riesgo_usuario.nivel === 'bajo',
                          'bg-amber-100 text-amber-700': pago.ocr_resultado.segunda_barrera.riesgo_usuario.nivel === 'medio',
                          'bg-red-100 text-red-700': pago.ocr_resultado.segunda_barrera.riesgo_usuario.nivel === 'alto',
                        }">
                        {{ pago.ocr_resultado.segunda_barrera.riesgo_usuario.nivel }}
                        ({{ Math.round((pago.ocr_resultado.segunda_barrera.riesgo_usuario.puntuacion || 0) * 100) }}%)
                      </span>
                    </div>
                    <ul v-if="pago.ocr_resultado.segunda_barrera.riesgo_usuario.factores?.length" class="space-y-0.5 ml-5">
                      <li v-for="(factor, i) in pago.ocr_resultado.segunda_barrera.riesgo_usuario.factores" :key="i"
                        class="text-[11px] text-indigo-700 list-disc">
                        {{ factor }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Motivo (opcional al rechazar) -->
            <div v-if="pagoEnRevision === pago.id && accionEnRevision === 'rechazar'" class="mb-4">
              <label class="block text-xs font-medium text-gray-700 mb-1">Motivo del rechazo (opcional)</label>
              <input
                v-model="motivoRevision"
                type="text"
                class="input text-sm"
                placeholder="Ej: Comprobante borroso, monto incorrecto..."
              />
            </div>

            <!-- Botones de acción -->
            <div class="flex gap-3">
              <button
                class="btn-primary text-sm flex items-center gap-1.5"
                :disabled="procesando"
                @click="aprobar(pago.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Aprobar
              </button>
              <button
                v-if="pagoEnRevision !== pago.id || accionEnRevision !== 'rechazar'"
                class="btn-secondary text-sm flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                :disabled="procesando"
                @click="iniciarRechazo(pago.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rechazar
              </button>
              <button
                v-else
                class="btn-secondary text-sm flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 border-red-600"
                :disabled="procesando"
                @click="rechazar(pago.id)"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal imagen grande -->
    <div
      v-if="imagenAbierta"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click="imagenAbierta = null"
    >
      <img :src="imagenAbierta" alt="Comprobante ampliado" class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { pagosApi, parametrosApi } from '@/api'

const pendientes = ref([])
const loading = ref(true)
const errorMsg = ref('')
const procesando = ref(false)
const pagoEnRevision = ref(null)
const accionEnRevision = ref(null)
const motivoRevision = ref('')
const imagenAbierta = ref(null)
const simboloMoneda = ref('L')

function formatMonto(monto) {
  const n = parseFloat(monto)
  if (isNaN(n)) return '—'
  return `${simboloMoneda.value} ${n.toFixed(2)}`
}

function abrirImagen(url) {
  imagenAbierta.value = url
}

async function cargarPendientes() {
  loading.value = true
  errorMsg.value = ''
  try {
    pendientes.value = await pagosApi.getPendientesRevision()
  } catch (err) {
    errorMsg.value = err?.error || err?.message || 'Error al cargar comprobantes'
  } finally {
    loading.value = false
  }
}

function iniciarRechazo(pagoId) {
  pagoEnRevision.value = pagoId
  accionEnRevision.value = 'rechazar'
  motivoRevision.value = ''
}

async function aprobar(pagoId) {
  procesando.value = true
  try {
    await pagosApi.revisionManual(pagoId, { aprobado: true })
    pendientes.value = pendientes.value.filter(p => p.id !== pagoId)
  } catch (err) {
    errorMsg.value = err?.error || err?.message || 'Error al aprobar'
  } finally {
    procesando.value = false
  }
}

async function rechazar(pagoId) {
  procesando.value = true
  try {
    await pagosApi.revisionManual(pagoId, {
      aprobado: false,
      motivo: motivoRevision.value || undefined,
    })
    pendientes.value = pendientes.value.filter(p => p.id !== pagoId)
    pagoEnRevision.value = null
    accionEnRevision.value = null
    motivoRevision.value = ''
  } catch (err) {
    errorMsg.value = err?.error || err?.message || 'Error al rechazar'
  } finally {
    procesando.value = false
  }
}

onMounted(async () => {
  // Cargar símbolo de moneda
  try {
    const pMoneda = await parametrosApi.getByClave('simbolo_moneda').catch(() => null)
    simboloMoneda.value = pMoneda?.valor || 'L'
  } catch { /* usar default */ }

  cargarPendientes()
})
</script>
