<template>
  <div class="p-6 sm:p-8">
      <div class="max-w-5xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">Panel de administración</h1>
        <p class="text-gray-600 mb-8">Gestiona configuraciones y opciones exclusivas del restaurante.</p>

        <div class="grid gap-4 sm:grid-cols-2">
          <router-link to="/admin/configuraciones" class="admin-card">
            <div class="admin-card-icon admin-card-icon-amber">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-gray-900">Configuraciones</h2>
              <p class="text-sm text-gray-500 mt-0.5">Parámetros del sistema y horarios del restaurante.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
          <router-link to="/admin/mesas" class="admin-card">
            <div class="admin-card-icon admin-card-icon-amber">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-gray-900">Mesas</h2>
              <p class="text-sm text-gray-500 mt-0.5">Añade o retira mesas del restaurante.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>

        <div class="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
          <p class="font-medium">Área exclusiva para managers</p>
          <p class="mt-1 text-amber-700">Desde aquí puedes modificar parámetros de reservas, horarios de apertura y demás opciones del sistema. Los clientes no tienen acceso a esta sección.</p>
        </div>
      </div>
    </div>
</template>

<script setup>
</script>

<style scoped>
.admin-card {
  @apply flex items-center gap-4 p-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-primary-200 hover:shadow-md transition-all;
}
.admin-card-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center shrink-0;
}
.admin-card-icon-amber {
  @apply bg-amber-100 text-amber-700;
}
</style>
