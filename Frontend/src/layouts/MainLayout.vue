<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white shadow-sm border-b border-gray-100">
      <nav class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <router-link to="/" class="flex items-center gap-2">
            <img src="/logos/IMGReservaYa.webp" alt="ReservaYa" class="h-9 object-contain" />
          </router-link>
          <div class="flex items-center gap-4">
            <template v-if="authStore.isAuthenticated">
              <span class="text-sm text-gray-600">{{ authStore.userNombre }}</span>
              <button type="button" @click="cerrarSesion" class="btn-secondary text-sm">Salir</button>
            </template>
            <template v-else>
              <router-link v-if="$route.path !== '/'" to="/" class="btn-primary text-sm">Iniciar sesión</router-link>
              <router-link v-else to="/inicio" class="text-gray-600 hover:text-primary-600 font-medium text-sm">Inicio</router-link>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="bg-gray-100 border-t border-gray-200 py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <img src="/logos/IMGReservaYa.webp" alt="ReservaYa" class="h-5 object-contain inline-block opacity-70" />
        <span class="ml-1">© {{ new Date().getFullYear() }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function cerrarSesion() {
  authStore.logout()
  router.push('/')
}
</script>
