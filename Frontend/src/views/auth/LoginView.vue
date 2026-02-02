<template>
  <MainLayout>
    <!-- Fondo: logo grande centrado -->
    <div
      class="min-h-[calc(100vh-8rem)] flex items-center justify-center relative overflow-hidden"
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

        <p v-if="error" class="mb-4 text-sm text-red-600 bg-red-50/80 px-3 py-2 rounded-lg">{{ error }}</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="email" type="email" class="input bg-white/80" placeholder="tu@email.com" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input v-model="password" type="password" class="input bg-white/80" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="mt-6 text-center">
          <router-link to="/inicio" class="text-gray-600 hover:text-primary-600 text-sm font-medium">Volver al inicio</router-link>
        </p>
      </div>
    </div>

    <!-- Credenciales de prueba (solo desarrollo) -->
    <div class="fixed bottom-4 left-4 bg-gray-800/90 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-lg max-w-[220px]">
      <p class="font-semibold text-gray-300 mb-1.5">Pruebas</p>
      <p class="mb-0.5"><span class="text-gray-400">Admin:</span> admin@mesasegura.com / admin</p>
      <p><span class="text-gray-400">Usuario:</span> usuario@mesasegura.com / usuario</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/inicio')
  } catch (err) {
    error.value = err?.error || err?.message || 'Credenciales incorrectas'
  } finally {
    loading.value = false
  }
}
</script>
