<template>
  <MainLayout :hide-header="true" :hide-footer="true">
    <!-- Fondo: logo centrado -->
    <div
      class="min-h-[calc(110vh-8rem)] flex items-center justify-center relative overflow-hidden"
      style="background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.6));"
    >
      <img
        src="/logos/IMGReservaYa.webp"
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
            <input v-model="username" type="text" class="input bg-white/80" placeholder="tu_usuario" required autocomplete="username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input v-model="password" type="password" class="input bg-white/80" placeholder="••••••••" required />
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
      <p class="mb-0.5"><span class="text-gray-400">Admin:</span> administradorsistema1 / admin</p>
      <p><span class="text-gray-400">Cliente:</span> usuarioprueba2 / usuario</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Alert from '@/components/ui/Alert.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
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
