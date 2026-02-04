<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header v-if="!hideHeader" class="topbar">
      <div class="topbar-inner">
        <router-link :to="authStore.isAuthenticated ? '/inicio' : '/'" class="topbar-logo">
          <img src="/logos/Logo_letras.webp" alt="ReservaYa" class="h-8 object-contain" />
        </router-link>

        <nav v-if="authStore.isAuthenticated" class="topbar-nav">
          <router-link to="/inicio" class="topbar-link" :class="{ 'topbar-link-active': $route.path === '/inicio' }">
            Inicio
          </router-link>
          <router-link to="/reservas/nueva" class="topbar-link" :class="{ 'topbar-link-active': $route.path === '/reservas/nueva' }">
            Nueva reserva
          </router-link>
        </nav>

        <div class="topbar-actions">
          <template v-if="authStore.isAuthenticated">
            <router-link
              v-if="authStore.esManager"
              to="/admin"
              class="topbar-admin-btn"
              :class="{ 'topbar-admin-btn-active': $route.path.startsWith('/admin') }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Panel admin
            </router-link>
            <div class="topbar-user">
              <span class="topbar-user-name">{{ authStore.userNombre }}</span>
              <button type="button" class="topbar-logout" @click="cerrarSesion">Salir</button>
            </div>
          </template>
          <template v-else>
            <router-link v-if="$route.path !== '/'" to="/" class="btn-primary text-sm">Iniciar sesión</router-link>
            <router-link v-else to="/inicio" class="text-sm text-gray-600 hover:text-primary-600 font-medium">Inicio</router-link>
          </template>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer v-if="!hideFooter" class="border-t border-gray-200 bg-white py-6 mt-auto">
      <div class="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <img src="/logos/Logo_letras.webp" alt="ReservaYa" class="h-5 object-contain inline-block opacity-70" />
        <span class="ml-1">© {{ new Date().getFullYear() }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  hideHeader: { type: Boolean, default: false },
  hideFooter: { type: Boolean, default: false }
})

const router = useRouter()
const authStore = useAuthStore()

function cerrarSesion() {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.topbar {
  @apply sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm;
}
.topbar-inner {
  @apply max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4;
}
.topbar-logo {
  @apply flex items-center shrink-0;
}
.topbar-nav {
  @apply hidden sm:flex items-center gap-1;
}
.topbar-link {
  @apply px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors;
}
.topbar-link-active {
  @apply text-primary-600 bg-primary-50;
}
.topbar-actions {
  @apply flex items-center gap-2 sm:gap-3;
}
.topbar-admin-btn {
  @apply inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors;
}
.topbar-admin-btn-active {
  @apply bg-amber-100 border-amber-300 text-amber-900;
}
.topbar-user {
  @apply flex items-center gap-2 pl-2 border-l border-gray-200;
}
.topbar-user-name {
  @apply text-sm text-gray-600 hidden sm:inline max-w-[120px] truncate;
}
.topbar-logout {
  @apply text-sm font-medium px-2.5 py-1.5 rounded-md text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-colors;
}
</style>
