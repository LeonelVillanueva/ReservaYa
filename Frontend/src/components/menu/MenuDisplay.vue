<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900">Nuestro Menú</h2>
        <p class="text-sm text-gray-500">Descubre lo que tenemos para ti</p>
      </div>
      <span v-if="!loading && authStore.esManager" class="text-xs text-gray-400">{{ platosFiltrados.length }} platos</span>
    </div>

    <!-- Filtros por categoría (pills) -->
    <div v-if="menuStore.categorias.length > 1" class="flex flex-wrap gap-2 mb-5">
      <button
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="categoriaActiva === null
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="categoriaActiva = null"
      >
        Todos
      </button>
      <button
        v-for="cat in menuStore.categorias"
        :key="cat.id"
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="categoriaActiva === cat.id
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="categoriaActiva = cat.id"
      >
        {{ cat.nombre }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="text-gray-400 text-sm">Cargando menú...</span>
    </div>

    <!-- Sin platos -->
    <div v-else-if="platosFiltrados.length === 0" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <p class="text-gray-400 text-sm">No hay platos disponibles{{ categoriaActiva ? ' en esta categoría' : '' }}.</p>
    </div>

    <!-- Grid de platos -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="plato in platosFiltrados"
        :key="plato.id"
        class="group rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
      >
        <!-- Imagen -->
        <div class="aspect-[4/3] bg-gray-50 overflow-hidden relative">
          <img
            v-if="plato.imagen_url"
            :src="plato.imagen_url"
            :alt="plato.nombre"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Badge categoría -->
          <span
            v-if="plato.categoria?.nombre"
            class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm"
          >
            {{ plato.categoria.nombre }}
          </span>
        </div>

        <!-- Info -->
        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-sm font-semibold text-gray-900 leading-tight">{{ plato.nombre }}</h3>
            <span class="text-sm font-bold text-primary-600 shrink-0">L {{ Number(plato.precio || 0).toFixed(2) }}</span>
          </div>
          <p v-if="plato.descripcion" class="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{{ plato.descripcion }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useAuthStore } from '@/stores/auth'

const menuStore = useMenuStore()
const authStore = useAuthStore()
const loading = ref(true)
const categoriaActiva = ref(null)

const platosFiltrados = computed(() => {
  if (!categoriaActiva.value) return menuStore.platos
  return menuStore.platos.filter(p => p.categoria_id === categoriaActiva.value)
})

async function cargar() {
  loading.value = true
  try {
    await Promise.all([
      menuStore.fetchPlatos({ disponible: true }),
      menuStore.fetchCategorias(),
    ])
  } catch (err) {
    console.error('Error cargando menú:', err)
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
