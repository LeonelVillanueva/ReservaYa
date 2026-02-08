<template>
  <MainLayout :hide-header="true" :hide-footer="true">
    <div
      class="min-h-[calc(110vh-8rem)] flex items-center justify-center relative overflow-hidden"
      style="background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.6));"
    >
      <img
        :src="appImagesStore.logoUrl"
        alt=""
        class="absolute inset-0 w-full h-full object-contain object-center opacity-20 scale-130 pointer-events-none select-none"
        aria-hidden="true"
      />

      <div
        class="relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-xl bg-white/70 backdrop-blur-md border border-white/50"
      >
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Crear cuenta</h1>
        <p class="text-sm text-gray-600 mb-6">
          Regístrate para gestionar tus reservas de manera rápida y segura.
        </p>

        <Alert
          v-if="error"
          class="mb-4"
          variant="destructive"
          :title="errorCode === 'EMAIL_YA_REGISTRADO' ? 'Correo ya registrado' : 'No se pudo crear la cuenta'"
        >
          {{ error }}
          <p v-if="errorCode === 'EMAIL_YA_REGISTRADO'" class="mt-2 text-xs">
            <router-link to="/" class="font-medium underline hover:no-underline">Inicia sesión</router-link> si ya tienes cuenta.
          </p>
        </Alert>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                v-model="nombre"
                type="text"
                class="input bg-white/80"
                required
                autocomplete="given-name"
                @input="onNombreInput"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                v-model="apellido"
                type="text"
                class="input bg-white/80"
                autocomplete="family-name"
                @input="onApellidoInput"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              class="input bg-white/80"
              required
              autocomplete="email"
            />
            <p class="mt-1 text-xs text-gray-500">
              Usa un correo válido, por ejemplo: nombre@dominio.com
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <div class="flex gap-2">
              <!-- Selector custom de país: bandera + nombre al desplegar -->
              <div class="relative w-[120px]">
                <button
                  type="button"
                  class="input bg-white/80 flex items-center justify-between px-3 py-2 text-sm"
                  @click="paisOpen = !paisOpen"
                >
                  <span class="text-lg leading-none">{{ paisSeleccionado.bandera }}</span>
                  <span class="ml-1 text-[10px] text-gray-500 truncate">
                    +{{ paisSeleccionado.prefijo }}
                  </span>
                </button>
                <div
                  v-if="paisOpen"
                  class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                >
                  <button
                    v-for="p in paisesCentroamerica"
                    :key="p.codigo"
                    type="button"
                    class="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-gray-100"
                    @click="seleccionarPais(p)"
                  >
                    <span class="text-lg leading-none">{{ p.bandera }}</span>
                    <span class="ml-2 text-gray-700">{{ p.nombre }} (+{{ p.prefijo }})</span>
                  </button>
                </div>
              </div>

              <input
                v-model="telefono"
                type="tel"
                inputmode="numeric"
                class="input bg-white/80 flex-1"
                :maxlength="paisSeleccionado.digitos + (paisSeleccionado.digitos > 4 ? 1 : 0)"
                placeholder="9999-9999"
                @input="onTelefonoInput"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Solo números, sin prefijo. Para {{ paisSeleccionado.nombre }} deben ser
              {{ paisSeleccionado.digitos }} dígitos, con formato
              {{ paisSeleccionado.digitos === 7 ? '999-9999' : '9999-9999' }}.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input bg-white/80 pr-10"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.5 12H3" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <div class="relative">
                <input
                  v-model="passwordConfirm"
                  :type="showPasswordConfirm ? 'text' : 'password'"
                  class="input bg-white/80 pr-10"
                  required
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  :title="showPasswordConfirm ? 'Ocultar contraseña' : 'Ver contraseña'"
                  @click="showPasswordConfirm = !showPasswordConfirm"
                >
                  <svg v-if="showPasswordConfirm" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878a4.5 4.5 0 106.262 6.262M4.5 12H3" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full mt-2" :disabled="loading">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?
          <router-link to="/" class="font-medium text-primary-600 hover:text-primary-700">Inicia sesión</router-link>
        </p>
      </div>
    </div>

    <!-- Modal: tu usuario generado (al cerrar se copia al portapapeles) -->
    <Teleport to="body">
      <div
        v-if="mostrarModalUsername"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="cerrarModalUsername"
      >
        <div
          class="relative w-full max-w-md rounded-2xl shadow-xl bg-white p-6 border border-gray-200"
          role="dialog"
          aria-labelledby="modal-username-title"
        >
          <h2 id="modal-username-title" class="text-xl font-bold text-gray-900 mb-2">
            Cuenta creada
          </h2>
          <p class="text-sm text-gray-600 mb-4">
            Guarda tu usuario para iniciar sesión. Te hemos enviado un código de verificación a tu correo.
          </p>
          <div class="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
            <code class="flex-1 font-mono text-lg font-semibold text-gray-900 break-all">{{ usernameGenerado }}</code>
            <button
              type="button"
              class="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Copiar usuario"
              @click="copiarUsername"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p
            v-if="mostrarCopiado"
            class="mt-2 text-sm font-medium text-emerald-600 flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Usuario copiado al portapapeles
          </p>
          <p class="text-xs text-gray-500 mt-2 mb-4">
            Al cerrar esta ventana se copiará tu usuario al portapapeles.
          </p>
          <button
            type="button"
            class="btn-primary w-full"
            @click="cerrarModalUsername"
          >
            Ir a verificar correo
          </button>
        </div>
      </div>
    </Teleport>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Alert from '@/components/ui/Alert.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppImagesStore } from '@/stores/appImages'

const router = useRouter()
const authStore = useAuthStore()
const appImagesStore = useAppImagesStore()

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const telefono = ref('')

const paisesCentroamerica = [
  { codigo: 'HN', nombre: 'Honduras', prefijo: '504', digitos: 8, ejemplo: '9999-9999', bandera: '🇭🇳' },
  { codigo: 'GT', nombre: 'Guatemala', prefijo: '502', digitos: 8, ejemplo: '5555-5555', bandera: '🇬🇹' },
  { codigo: 'SV', nombre: 'El Salvador', prefijo: '503', digitos: 8, ejemplo: '7777-7777', bandera: '🇸🇻' },
  { codigo: 'NI', nombre: 'Nicaragua', prefijo: '505', digitos: 8, ejemplo: '8888-8888', bandera: '🇳🇮' },
  { codigo: 'CR', nombre: 'Costa Rica', prefijo: '506', digitos: 8, ejemplo: '8888-8888', bandera: '🇨🇷' },
  { codigo: 'PA', nombre: 'Panamá', prefijo: '507', digitos: 8, ejemplo: '6000-0000', bandera: '🇵🇦' },
  { codigo: 'BZ', nombre: 'Belice', prefijo: '501', digitos: 7, ejemplo: '222-2222', bandera: '🇧🇿' },
]

const pais = ref('HN')
const paisOpen = ref(false)

const paisSeleccionado = computed(() => {
  return paisesCentroamerica.find((p) => p.codigo === pais.value) || paisesCentroamerica[0]
})
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const error = ref('')
const errorCode = ref('')
const loading = ref(false)
const mostrarModalUsername = ref(false)
const usernameGenerado = ref('')
const mostrarCopiado = ref(false)
let timeoutCopiado = null

function copiarUsername() {
  if (!usernameGenerado.value) return
  navigator.clipboard.writeText(usernameGenerado.value).catch(() => {})
  if (timeoutCopiado) clearTimeout(timeoutCopiado)
  mostrarCopiado.value = true
  timeoutCopiado = setTimeout(() => {
    mostrarCopiado.value = false
    timeoutCopiado = null
  }, 2500)
}

function cerrarModalUsername() {
  if (usernameGenerado.value) {
    navigator.clipboard.writeText(usernameGenerado.value).catch(() => {})
    mostrarCopiado.value = true
    setTimeout(() => {
      mostrarModalUsername.value = false
      router.push('/verificar-correo')
    }, 1200)
  } else {
    mostrarModalUsername.value = false
    router.push('/verificar-correo')
  }
}

function limpiarNombre(raw) {
  // Permitir letras (incluyendo acentos), espacios y apóstrofe sencillo
  return (raw || '')
    .replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1' ]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart()
}

function onNombreInput(event) {
  nombre.value = limpiarNombre(event.target.value)
}

function onApellidoInput(event) {
  apellido.value = limpiarNombre(event.target.value)
}

function seleccionarPais(p) {
  pais.value = p.codigo
  paisOpen.value = false
  // Reaplicar formato al teléfono actual según nueva longitud
  if (telefono.value) {
    onTelefonoInput({ target: { value: telefono.value } })
  }
}

function onTelefonoInput(event) {
  const max = paisSeleccionado.value.digitos
  // Mantener solo dígitos
  let raw = (event.target.value || '').replace(/\D/g, '')
  raw = raw.slice(0, max)

  let formatted = raw
  if (max === 8 && raw.length > 4) {
    formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`
  } else if (max === 7 && raw.length > 3) {
    formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`
  }

  telefono.value = formatted
}

async function handleRegister() {
  error.value = ''
  errorCode.value = ''

  // Validar nombre y apellido (solo letras y espacios)
  if (!nombre.value || limpiarNombre(nombre.value).length < 2) {
    error.value = 'Ingresa un nombre válido (solo letras).'
    return
  }

  if (apellido.value && limpiarNombre(apellido.value).length < 2) {
    error.value = 'Si ingresas apellido, debe tener al menos 2 letras.'
    return
  }

  // Validar email simple
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    error.value = 'Ingresa un email válido (ejemplo: nombre@dominio.com)'
    return
  }

  // Normalizar teléfono para enviar: solo dígitos
  const telefonoSoloDigitos = (telefono.value || '').replace(/\D/g, '')

  if (!telefonoSoloDigitos) {
    error.value = 'El teléfono es obligatorio'
    return
  }

  if (telefonoSoloDigitos.length !== paisSeleccionado.value.digitos) {
    error.value = `El teléfono para ${paisSeleccionado.value.nombre} debe tener exactamente ${paisSeleccionado.value.digitos} dígitos (sin prefijo).`
    return
  }

  if (password.value !== passwordConfirm.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true
  try {
    await authStore.register({
      nombre: nombre.value,
      apellido: apellido.value,
      email: email.value,
      telefono: telefonoSoloDigitos,
      password: password.value,
    })

    mostrarModalUsername.value = true
    usernameGenerado.value = authStore.user?.username || ''
  } catch (err) {
    error.value = err?.error || err?.message || 'No se pudo crear la cuenta'
    errorCode.value = err?.code || ''
  } finally {
    loading.value = false
  }
}
</script>

