<template>
  <MainLayout :hide-header="true" :hide-footer="true">
    <!-- Fondo: logo centrado -->
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
      <!-- Caja de login centrada, semi-transparente -->
      <div
        class="relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-xl bg-white/70 backdrop-blur-md border border-white/50"
      >
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Iniciar sesión</h1>

        <Transition name="alert">
          <Alert
            v-if="error"
            class="mb-4"
            variant="destructive"
            title="Error al iniciar sesión"
          >
            {{ error }}
          </Alert>
        </Transition>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input v-model="username" type="text" class="input bg-white/80" required autocomplete="username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input bg-white/80 pr-10"
                placeholder="•••••••••••"
                required
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                @click="showPassword = !showPassword"
                :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <!-- Ojo abierto (mostrar) -->
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Ojo cerrado (ocultar) -->
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-600">
          ¿Aún no tienes cuenta?
          <router-link to="/registro" class="font-medium text-primary-600 hover:text-primary-700">Regístrate</router-link>
        </p>
      </div>
    </div>

    <!-- Credenciales de prueba (solo desarrollo) -->
    <div class="fixed bottom-4 left-4 bg-gray-800/90 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-lg max-w-[260px]">
      <p class="font-semibold text-gray-300 mb-1.5">Pruebas</p>
      <p class="mb-0.5"><span class="text-gray-400">Admin:</span> administradorsistema1/ admin</p>
      <p><span class="text-gray-400">Cliente:</span> usuarioprueba2/ usuario</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Alert from '@/components/ui/Alert.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppImagesStore } from '@/stores/appImages'

const router = useRouter()
const authStore = useAuthStore()
const appImagesStore = useAppImagesStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)
let errorTimeoutId = null

function clearErrorAfter(ms) {
  if (errorTimeoutId) clearTimeout(errorTimeoutId)
  errorTimeoutId = setTimeout(() => {
    error.value = ''
    errorTimeoutId = null
  }, ms)
}

onUnmounted(() => {
  if (errorTimeoutId) clearTimeout(errorTimeoutId)
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login({ username: username.value, password: password.value })
    router.push('/inicio')
  } catch (err) {
    if (err?.code === 'EMAIL_NO_VERIFICADO') {
      router.push('/verificar-correo')
      return
    }
    error.value = err?.error || err?.message || 'Credenciales incorrectas'
    username.value = ''
    password.value = ''
    clearErrorAfter(5000)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.alert-enter-active,
.alert-leave-active {
  transition: opacity 0.25s ease;
}
.alert-enter-from,
.alert-leave-to {
  opacity: 0;
}
</style>
