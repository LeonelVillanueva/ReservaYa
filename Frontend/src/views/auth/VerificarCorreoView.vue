<template>
  <MainLayout :hide-header="true" :hide-footer="true">
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
      <div
        class="relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-xl bg-white/70 backdrop-blur-md border border-white/50"
      >
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Verifica tu correo</h1>
        <p class="text-sm text-gray-600 mb-6">
          Hemos enviado un código de 6 caracteres a <strong>{{ authStore.user?.email }}</strong>. Ingrésalo abajo para activar tu cuenta.
        </p>

        <Alert
          v-if="error"
          class="mb-4"
          variant="destructive"
          title="Error"
        >
          {{ error }}
        </Alert>
        <Alert
          v-if="successMessage"
          class="mb-4"
          variant="info"
          title="Listo"
        >
          {{ successMessage }}
        </Alert>

        <form @submit.prevent="handleVerificar" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código de verificación</label>
            <input
              v-model="codigo"
              type="text"
              class="input bg-white/80 font-mono text-center text-lg tracking-widest uppercase"
              placeholder="ABC123"
              maxlength="6"
              autocomplete="one-time-code"
              @input="onCodigoInput"
            />
            <p class="mt-1 text-xs text-gray-500">6 letras o números (revisa tu correo)</p>
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading || codigo.length !== 6">
            {{ loading ? 'Verificando...' : 'Verificar correo' }}
          </button>
        </form>

        <div class="mt-6 pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-600 mb-2">¿No recibiste el código?</p>
          <button
            type="button"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
            :disabled="reenviando"
            @click="handleReenviar"
          >
            {{ reenviando ? 'Enviando...' : 'Reenviar código' }}
          </button>
        </div>

        <p class="mt-6 text-center text-sm text-gray-600">
          <router-link to="/" class="font-medium text-primary-600 hover:text-primary-700">Volver al inicio de sesión</router-link>
        </p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Alert from '@/components/ui/Alert.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const codigo = ref('')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)
const reenviando = ref(false)

function onCodigoInput(event) {
  const raw = (event.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  codigo.value = raw.slice(0, 6)
}

async function handleVerificar() {
  if (codigo.value.length !== 6) return
  error.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    await authStore.verificarEmail(codigo.value)
    successMessage.value = 'Correo verificado. Redirigiendo...'
    setTimeout(() => router.push('/inicio'), 800)
  } catch (err) {
    error.value = err?.error || err?.message || 'No se pudo verificar el código'
  } finally {
    loading.value = false
  }
}

async function handleReenviar() {
  error.value = ''
  successMessage.value = ''
  reenviando.value = true
  try {
    await authStore.reenviarCodigo()
    successMessage.value = 'Se ha enviado un nuevo código a tu correo.'
  } catch (err) {
    error.value = err?.error || err?.message || 'No se pudo reenviar el código'
  } finally {
    reenviando.value = false
  }
}

onMounted(async () => {
  if (!authStore.token) {
    router.replace('/')
    return
  }
  if (authStore.emailVerificado) {
    router.replace('/inicio')
    return
  }
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})
</script>
