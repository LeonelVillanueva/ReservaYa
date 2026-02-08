<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-gray-800 relative overflow-hidden">
    <!-- Fondo degradado -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-orange-50"></div>

    <!-- Círculos flotantes decorativos -->
    <div class="absolute w-72 h-72 bg-primary-100 rounded-full blur-3xl opacity-40 top-10 left-10 floating"></div>
    <div class="absolute w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-40 bottom-10 right-10 floating-delayed"></div>

    <!-- Contenido principal -->
    <div class="relative z-10 text-center px-6 max-w-lg bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-10 border border-white/40">
      <!-- Logo -->
      <div class="mb-6 floating">
        <img
          :src="appImagesStore.logoLetrasUrl"
          alt="ReservaYa Logo"
          class="mx-auto h-16 opacity-90"
        >
      </div>

      <!-- Código de error -->
      <h1 class="text-8xl font-extrabold text-gray-900 tracking-tight">{{ isLoadError ? '¡Oops!' : '404' }}</h1>
      <h2 class="text-2xl font-semibold text-gray-700 mt-2">{{ title }}</h2>

      <p class="text-gray-500 mt-4 leading-relaxed" v-html="description"></p>

      <!-- Botones de acción -->
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <router-link
          to="/"
          class="action-btn inline-flex items-center gap-2 bg-primary-600 text-white font-semibold py-3 px-8 rounded-full hover:bg-primary-700 shadow-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
          </svg>
          Ir al inicio
        </router-link>

        <!-- Botón recargar (solo para errores de carga) -->
        <button
          v-if="isLoadError"
          @click="reloadPage"
          class="action-btn inline-flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 shadow-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reintentar
        </button>

        <!-- Botón volver (solo para 404) -->
        <button
          v-else
          @click="$router.back()"
          class="action-btn inline-flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold py-3 px-8 rounded-full hover:bg-gray-300 shadow-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver atrás
        </button>
      </div>
    </div>

    <!-- Footer -->
    <footer class="relative z-10 mt-12 text-center text-sm text-gray-500">
      &copy; {{ new Date().getFullYear() }} ReservaYa — Sistema de Reservas
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppImagesStore } from '@/stores/appImages'

const route = useRoute()
const appImagesStore = useAppImagesStore()

const isLoadError = computed(() => route.query.error === 'load')

const title = computed(() =>
  isLoadError.value
    ? 'Error al cargar la página'
    : '¡Página no encontrada!'
)

const description = computed(() =>
  isLoadError.value
    ? 'Hubo un problema al cargar esta página.<br>Puede ser un error de conexión o que el servidor no esté disponible. Intenta de nuevo.'
    : 'No pudimos encontrar la página que buscas.<br>Es posible que haya sido movida, eliminada o que nunca haya existido.'
)

function reloadPage() {
  // Quitar el query param de error y recargar la ruta original
  const intended = route.query.intended || '/'
  window.location.href = intended
}
</script>

<style scoped>
.action-btn {
  transition: all 0.25s ease-in-out;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.floating {
  animation: float 6s ease-in-out infinite;
}

.floating-delayed {
  animation: float 8s ease-in-out infinite 2s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}
</style>
