<template>
  <MainLayout>
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex flex-col lg:flex-row gap-6 items-start">

      <!-- ============================================ -->
      <!-- PASO 1: Datos de la reserva                  -->
      <!-- ============================================ -->
      <div v-if="paso === 1" class="card p-6 flex-1 w-full lg:max-w-xl">
        <div class="flex items-center gap-3 mb-6">
          <router-link to="/inicio" class="text-gray-500 hover:text-gray-700">← Volver</router-link>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-6">Nueva reserva</h1>

        <p v-if="error" class="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</p>

        <!-- Solo administrador: opción reserva por llamada -->
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

        <!-- Datos del cliente por llamada -->
        <div v-if="form.reservaPorLlamada" class="mb-5 rounded-lg bg-amber-50/80 border border-amber-200 px-3 py-3 text-sm leading-tight">
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

          <!-- Método de pago -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Método de pago del anticipo</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Transferencia -->
              <button
                type="button"
                class="relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                :class="form.metodoPago === 'transferencia'
                  ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'"
                @click="form.metodoPago = 'transferencia'"
              >
                <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">Transferencia bancaria</p>
                  <p class="text-[11px] text-gray-500">Suba comprobante para verificación</p>
                </div>
                <div v-if="form.metodoPago === 'transferencia'" class="absolute top-2 right-2">
                  <svg class="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
              </button>

              <!-- Tarjeta (Próximamente) -->
              <div
                class="relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
              >
                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-500">Tarjeta de crédito/débito</p>
                  <p class="text-[11px] text-gray-400">Próximamente</p>
                </div>
                <span class="absolute top-2 right-2 text-[9px] font-bold text-white bg-gray-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  En desarrollo
                </span>
              </div>
            </div>
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

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary" :disabled="loading || !puedeEnviar || diaCerrado">
              {{ loading ? 'Creando...' : 'Continuar al pago' }}
            </button>
            <router-link to="/inicio" class="btn-secondary">Cancelar</router-link>
          </div>
        </form>
      </div>

      <!-- ============================================ -->
      <!-- PASO 2: Pago — Transferencia                 -->
      <!-- ============================================ -->
      <div v-else-if="paso === 2" class="card p-6 flex-1 w-full lg:max-w-xl">
        <div class="flex items-center gap-3 mb-6">
          <button type="button" class="text-gray-500 hover:text-gray-700" @click="volverPaso1">← Volver al formulario</button>
        </div>

        <h1 class="text-xl font-bold text-gray-900 mb-2">Pago del anticipo</h1>
        <p class="text-sm text-gray-500 mb-6">
          Realice la transferencia por <span class="font-bold text-primary-700">{{ montoAnticipoFormateado }}</span> y suba el comprobante.
        </p>

        <p v-if="errorPago" class="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ errorPago }}</p>

        <!-- Datos bancarios del restaurante -->
        <div class="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos para transferencia</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Banco:</span>
              <span class="font-medium text-gray-800">Banco Atlántida</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Cuenta:</span>
              <span class="font-medium text-gray-800 font-mono">XXXX-XXXX-XXXX</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">A nombre de:</span>
              <span class="font-medium text-gray-800">Restaurante Demo</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Monto exacto:</span>
              <span class="font-bold text-primary-700">{{ montoAnticipoFormateado }}</span>
            </div>
          </div>
        </div>

        <!-- Upload de comprobante -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Comprobante de transferencia</label>

          <!-- Zona de drop -->
          <div
            class="relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden"
            :class="[
              archivoComprobante
                ? 'border-primary-300 bg-primary-50/40'
                : dragOver
                  ? 'border-primary-400 bg-primary-50/60'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
            ]"
            @click="$refs.inputComprobante.click()"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDropComprobante"
          >
            <!-- Preview de imagen -->
            <div v-if="previewUrl" class="p-3">
              <img :src="previewUrl" alt="Comprobante" class="w-full max-h-64 object-contain rounded-lg" />
              <div class="flex items-center justify-between mt-3 px-1">
                <div class="flex items-center gap-2 min-w-0">
                  <svg class="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs text-gray-600 truncate">{{ archivoComprobante.name }}</span>
                </div>
                <button
                  type="button"
                  class="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                  @click.stop="quitarComprobante"
                >
                  Quitar
                </button>
              </div>
            </div>

            <!-- Placeholder si no hay imagen -->
            <div v-else class="py-10 px-4 text-center">
              <svg class="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm text-gray-600 font-medium">Click o arrastre su comprobante aquí</p>
              <p class="text-xs text-gray-400 mt-1">JPG, PNG o WebP (máx. 10 MB)</p>
            </div>

            <input
              ref="inputComprobante"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onSeleccionarComprobante"
            />
          </div>
        </div>

        <!-- Estado de verificación OCR -->
        <div v-if="verificandoOCR" class="mb-6">
          <div class="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg class="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span class="text-sm font-semibold text-blue-700">Verificando comprobante...</span>
            </div>
            <p class="text-xs text-blue-500">Analizando imagen con OCR. Esto puede tardar unos segundos.</p>
          </div>
        </div>

        <!-- Resultado: Éxito -->
        <div v-if="resultadoVerificacion === 'aprobado'" class="mb-6">
          <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <svg class="w-10 h-10 mx-auto text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm font-bold text-emerald-800">Comprobante verificado</p>
            <p class="text-xs text-emerald-600 mt-1">Su reserva ha sido confirmada exitosamente.</p>
            <button
              type="button"
              class="btn-primary mt-4 text-sm"
              @click="router.push('/inicio')"
            >
              Ir al inicio
            </button>
          </div>
        </div>

        <!-- Resultado: Comprobante en revisión -->
        <div v-else-if="resultadoVerificacion === 'revision'" class="mb-6">
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <svg class="w-10 h-10 mx-auto text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm font-bold text-amber-800">Comprobante recibido</p>
            <p class="text-xs text-amber-600 mt-1">
              Su comprobante ha sido recibido y está siendo verificado. Un administrador lo revisará pronto.
            </p>
            <p class="text-xs text-gray-500 mt-2">Le notificaremos cuando su reserva sea confirmada.</p>
            <button
              type="button"
              class="btn-primary mt-4 text-sm"
              @click="router.push('/inicio')"
            >
              Ir al inicio
            </button>
          </div>
        </div>

        <!-- (El estado "rechazado" ya no se muestra al cliente — todo va a revisión) -->

        <!-- Botón de verificar -->
        <div v-if="!verificandoOCR && !resultadoVerificacion" class="flex gap-3">
          <button
            type="button"
            class="btn-primary flex-1"
            :disabled="!archivoComprobante || verificandoOCR"
            @click="verificarComprobante"
          >
            Verificar y confirmar
          </button>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- Panel flotante: Resumen de reserva           -->
      <!-- ============================================ -->
      <div class="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
        <div class="card p-5 border border-primary-100/60 shadow-lg bg-gradient-to-b from-primary-50/30 to-white">
          <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Resumen de reserva
          </h3>

          <!-- Indicador de paso -->
          <div class="flex items-center gap-2 mb-4">
            <div class="flex items-center gap-1.5">
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                :class="paso >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'"
              >1</span>
              <span class="text-[11px] font-medium" :class="paso === 1 ? 'text-primary-700' : 'text-gray-400'">Datos</span>
            </div>
            <div class="w-6 h-px bg-gray-300" />
            <div class="flex items-center gap-1.5">
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                :class="paso >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'"
              >2</span>
              <span class="text-[11px] font-medium" :class="paso === 2 ? 'text-primary-700' : 'text-gray-400'">Pago</span>
            </div>
          </div>

          <div class="space-y-3">
            <!-- Titular -->
            <div>
              <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Titular</p>
              <p class="text-sm text-gray-800 font-medium mt-0.5">{{ resumenNombre }}</p>
              <p v-if="resumenContacto" class="text-xs text-gray-500 mt-0.5">{{ resumenContacto }}</p>
            </div>

            <div class="border-t border-gray-100" />

            <!-- Fecha y Hora -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Fecha</p>
                <p class="text-sm text-gray-800 mt-0.5 capitalize">{{ resumenFecha }}</p>
              </div>
              <div>
                <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Hora</p>
                <p class="text-sm text-gray-800 mt-0.5">{{ form.hora || '—' }}</p>
              </div>
            </div>

            <!-- Personas -->
            <div>
              <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Personas</p>
              <p class="text-sm text-gray-800 mt-0.5">
                {{ form.cantidad_personas || '—' }}
                {{ form.cantidad_personas === 1 ? 'persona' : 'personas' }}
              </p>
            </div>

            <!-- Mesa -->
            <div>
              <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Mesa asignada</p>
              <p
                class="text-sm mt-0.5"
                :class="resumenMesa === 'Sin asignar' ? 'text-gray-400 italic' : 'text-gray-800'"
              >{{ resumenMesa }}</p>
            </div>

            <!-- Notas -->
            <div v-if="form.notas">
              <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Notas</p>
              <p class="text-xs text-gray-600 mt-0.5 italic leading-relaxed">{{ form.notas }}</p>
            </div>

            <!-- Método de pago -->
            <div v-if="form.metodoPago" class="pt-2 border-t border-gray-100">
              <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Método de pago</p>
              <p class="text-sm text-gray-800 mt-0.5 capitalize">{{ form.metodoPago === 'transferencia' ? 'Transferencia bancaria' : form.metodoPago }}</p>
            </div>

            <!-- Anticipo -->
            <div v-if="montoAnticipo !== null" class="pt-2 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Anticipo</p>
                <p class="text-base font-bold text-primary-700">{{ montoAnticipoFormateado }}</p>
              </div>
            </div>

            <!-- Estado día -->
            <div v-if="form.fecha && diaCerrado" class="pt-2 border-t border-gray-100">
              <p class="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1.5 rounded-lg text-center">
                Cerrado este día
              </p>
            </div>

            <!-- Estado del pago (paso 2) -->
            <div v-if="paso === 2 && resultadoVerificacion" class="pt-2 border-t border-gray-100">
              <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Estado del pago</p>
              <p
                class="text-xs font-semibold mt-1 px-2 py-1 rounded-lg text-center"
                :class="{
                  'bg-emerald-50 text-emerald-700': resultadoVerificacion === 'aprobado',
                  'bg-amber-50 text-amber-700': resultadoVerificacion === 'revision',
                }"
              >
                {{ resultadoVerificacion === 'aprobado' ? 'Verificado' : 'En revisión' }}
              </p>
            </div>
          </div>
        </div>
      </div>

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
import { reservasApi, mesasApi, parametrosApi, pagosApi } from '@/api'
import { invalidateMesasCache } from '@/composables/useMesasConEstado'

const router = useRouter()
const authStore = useAuthStore()
const reservasStore = useReservasStore()

// === Estado del flujo ===
const paso = ref(1)
const reservaCreada = ref(null) // { reserva, pago } tras crear en paso 1
const archivoComprobante = ref(null)
const previewUrl = ref(null)
const dragOver = ref(false)
const verificandoOCR = ref(false)
const resultadoVerificacion = ref(null) // 'aprobado' | 'revision' | null
const errorPago = ref('')

const form = ref({
  fecha: '',
  hora: '20:00',
  cantidad_personas: 2,
  opcionIndex: '',
  notas: '',
  reservaPorLlamada: false,
  nombreCliente: '',
  telefonoCliente: '',
  metodoPago: 'transferencia',
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
const simboloMoneda = ref('L')
const diasAnticipoReservaMax = ref(4)
const error = ref('')
const loading = ref(false)
const horariosRestaurante = ref([])

const fechaMinima = computed(() => {
  const today = new Date()
  return today.toISOString().slice(0, 10)
})

const fechaMaxima = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + (diasAnticipoReservaMax.value || 4))
  return d.toISOString().slice(0, 10)
})

function diaSemanaDeFecha(fecha) {
  if (!fecha) return null
  return new Date(fecha + 'T12:00:00').getDay()
}

function estaActivo(horario) {
  if (horario?.activo === false || horario?.activo === 'false' || horario?.activo === 0) return false
  return true
}

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

const horarioParaFechaSeleccionada = computed(() => {
  if (!form.value.fecha) return null
  const lista = horariosNormalizados.value
  if (!lista.length) return null

  const diaJs = diaSemanaDeFecha(form.value.fecha)

  let h = lista.find((x) => {
    const d = x.dia_semana
    const coincide = d === diaJs || (diaJs === 0 && d === 7)
    return coincide && estaActivo(x)
  })

  if (!h && lista.length === 7 && lista[0]?.dia_semana === 0 && lista[6]?.dia_semana === 6) {
    const porIndice = lista[diaJs]
    if (porIndice && estaActivo(porIndice)) h = porIndice
  }

  return h || null
})

const diaCerrado = computed(() => {
  if (!form.value.fecha) return false
  if (!horariosRestaurante.value?.length) return false
  return !horarioParaFechaSeleccionada.value
})

const esHoy = computed(() => form.value.fecha === new Date().toISOString().slice(0, 10))

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
  return isNaN(n) ? montoAnticipo.value : `${simboloMoneda.value} ${n.toFixed(2)}`
})

// === Computados para el panel flotante de resumen ===

const resumenNombre = computed(() => {
  if (form.value.reservaPorLlamada) {
    return form.value.nombreCliente?.trim() || 'Sin nombre aún'
  }
  return authStore.userNombre || '—'
})

const resumenContacto = computed(() => {
  if (form.value.reservaPorLlamada) {
    if (!form.value.telefonoCliente) return ''
    return `+${paisSeleccionadoCliente.value.prefijo} ${form.value.telefonoCliente}`
  }
  const parts = []
  if (authStore.user?.email) parts.push(authStore.user.email)
  if (authStore.user?.telefono) parts.push(authStore.user.telefono)
  return parts.join(' · ') || ''
})

const resumenFecha = computed(() => {
  if (!form.value.fecha) return '—'
  const d = new Date(form.value.fecha + 'T12:00:00')
  return d.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })
})

const resumenMesa = computed(() => {
  const idx = form.value.opcionIndex !== '' ? Number(form.value.opcionIndex) : (opcionesAsignacion.value.length === 1 ? 0 : -1)
  const opcion = opcionesAsignacion.value[idx]
  if (!opcion) return 'Sin asignar'
  return textoOpcion(opcion)
})

// Nombre: solo letras
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
  if (!form.value.metodoPago) return false
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

// === Mapeo de método de pago a metodo_pago_id ===
const METODO_PAGO_IDS = {
  efectivo: 1,
  tarjeta: 2,
  transferencia: 3,
}

// === Paso 1: Crear reserva ===
async function enviar() {
  error.value = ''
  loading.value = true
  try {
    const monto = montoAnticipo.value !== null && montoAnticipo.value !== ''
      ? parseFloat(montoAnticipo.value)
      : 0
    const horaCompleta = form.value.hora.length === 5 ? form.value.hora + ':00' : form.value.hora
    const idx = form.value.opcionIndex !== '' ? Number(form.value.opcionIndex) : (opcionesAsignacion.value.length === 1 ? 0 : -1)
    const opcion = opcionesAsignacion.value[idx]
    if (!opcion?.mesa_ids?.length) {
      error.value = opcionesAsignacion.value.length === 0 ? 'No hay mesas disponibles para este horario.' : 'Seleccione una opción de mesa'
      return
    }

    const metodoPagoId = METODO_PAGO_IDS[form.value.metodoPago] || 3

    const payload = {
      mesa_ids: opcion.mesa_ids,
      fecha: form.value.fecha,
      hora: horaCompleta,
      cantidad_personas: form.value.cantidad_personas,
      duracion_estimada_minutos: 120,
      notas: form.value.notas || undefined,
      monto_anticipo: monto,
      metodo_pago_id: metodoPagoId,
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
    } else {
      payload.usuario_id = authStore.user.id
      payload.creado_por_id = authStore.user.id
    }

    const resultado = await reservasApi.create(payload)

    // Si requiere comprobante (transferencia), ir al paso 2
    if (resultado.requiere_comprobante) {
      reservaCreada.value = resultado
      paso.value = 2
    } else {
      // Pago inmediato (efectivo o manager por llamada): redirigir
      await reservasStore.fetchReservas(authStore.esManager ? {} : { usuario_id: authStore.user.id })
      invalidateMesasCache()
      router.push('/inicio')
    }
  } catch (err) {
    error.value = err?.error || err?.message || 'Error al crear la reserva'
  } finally {
    loading.value = false
  }
}

// === Paso 2: Comprobante y OCR ===

function onSeleccionarComprobante(event) {
  const file = event.target.files?.[0]
  if (!file) return
  setComprobante(file)
}

function onDropComprobante(event) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    setComprobante(file)
  }
}

function setComprobante(file) {
  // Validar tamaño (10MB)
  if (file.size > 10 * 1024 * 1024) {
    errorPago.value = 'La imagen excede 10 MB'
    return
  }
  archivoComprobante.value = file
  previewUrl.value = URL.createObjectURL(file)
  resultadoVerificacion.value = null
  errorPago.value = ''
}

function quitarComprobante() {
  archivoComprobante.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  resultadoVerificacion.value = null
}

function volverPaso1() {
  // Nota: la reserva ya fue creada como pendiente_pago.
  // Si vuelve, puede subir comprobante después desde sus reservas.
  paso.value = 1
}

async function verificarComprobante() {
  if (!archivoComprobante.value) {
    errorPago.value = 'Seleccione una imagen del comprobante.'
    return
  }
  if (!reservaCreada.value?.pago?.id) {
    errorPago.value = 'Error: no se encontró el pago asociado. Intente crear la reserva nuevamente.'
    return
  }

  verificandoOCR.value = true
  errorPago.value = ''
  resultadoVerificacion.value = null

  try {
    const resultado = await pagosApi.verificarComprobante(
      reservaCreada.value.pago.id,
      archivoComprobante.value
    )

    const v = resultado.verificacion

    if (v.valido) {
      resultadoVerificacion.value = 'aprobado'
      // Actualizar store de reservas
      await reservasStore.fetchReservas(authStore.esManager ? {} : { usuario_id: authStore.user.id })
      invalidateMesasCache()
    } else {
      // Si no fue aprobado, siempre mostrar "en revisión" con mensaje genérico.
      // No se revela al cliente la razón del rechazo.
      resultadoVerificacion.value = 'revision'
    }
  } catch (err) {
    errorPago.value = err?.error || err?.message || 'Error al verificar el comprobante'
  } finally {
    verificandoOCR.value = false
  }
}

// === Carga de datos ===

async function cargarParametrosReserva() {
  try {
    const [pMonto, pDias, pMoneda] = await Promise.all([
      parametrosApi.getByClave('monto_anticipo'),
      parametrosApi.getByClave('dias_anticipo_reserva_max'),
      parametrosApi.getByClave('simbolo_moneda').catch(() => null),
    ])
    montoAnticipo.value = pMonto?.valor ?? ''
    const n = parseInt(pDias?.valor, 10)
    diasAnticipoReservaMax.value = Number.isFinite(n) && n >= 0 ? n : 4
    simboloMoneda.value = pMoneda?.valor || 'L'
  } catch {
    montoAnticipo.value = ''
    diasAnticipoReservaMax.value = 4
    simboloMoneda.value = 'L'
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

async function cargarHorarios() {
  try {
    const res = await parametrosApi.getHorarios()
    const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])
    horariosRestaurante.value = list || []
  } catch {
    horariosRestaurante.value = []
  }
}

cargarParametrosReserva()
cargarHorarios()
</script>
