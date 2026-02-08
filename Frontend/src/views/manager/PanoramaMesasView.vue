<template>
  <div class="p-6 sm:p-8 flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Panorama de mesas</h1>
        <p class="text-sm text-gray-600 mt-1">
          Vista general de todas las mesas y sus estados en tiempo real.
        </p>
      </div>
    </header>

    <section class="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-h-[320px]">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
            {{ resumenMesas.disponibles }} disponibles
          </span>
          <span class="text-gray-400">·</span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-orange-500" aria-hidden="true" />
            {{ resumenMesas.reservadas }} reservadas
          </span>
          <span class="text-gray-400">·</span>
          <span class="flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
            {{ resumenMesas.ocupadas }} ocupadas
          </span>
        </div>
        <div class="inline-flex items-center gap-1 rounded-full bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
          <button
            type="button"
            class="px-2 py-1 rounded-full"
            :class="vista === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-600'"
            @click="vista = 'grid'"
          >
            Cuadrícula
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-full"
            :class="vista === 'lista' ? 'bg-white shadow text-gray-900' : 'text-gray-600'"
            @click="vista = 'lista'"
          >
            Lista
          </button>
        </div>
      </div>

      <div v-if="loadingMesas" class="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Cargando mesas...
      </div>
      <div v-else-if="!mesasConEstado.length" class="flex-1 flex items-center justify-center text-gray-500 text-sm">
        No hay mesas configuradas.
      </div>
      <div v-else class="flex-1 overflow-auto">
        <!-- Vista cuadrícula (compacta) -->
        <div
          v-if="vista === 'grid'"
          class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
        >
          <div
            v-for="m in mesasConEstado"
            :key="m.id"
            class="flex flex-col rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
          >
            <span class="text-center text-xs font-semibold text-gray-900 py-1">
              Mesa {{ m.numero_mesa }}
            </span>
            <div class="relative flex-1 aspect-square">
              <img
                :src="appImagesStore.mesaUrl"
                :alt="'Mesa ' + m.numero_mesa + ', estado: ' + (m.estado || 'disponible')"
                class="w-full h-full object-contain"
              />
              <div
                class="absolute bottom-1.5 left-1.5 px-1 py-0.5 rounded-full text-[9px] font-semibold shadow bg-yellow-100 text-gray-700"
              >
                {{ m.capacidad ?? 0 }} pers.
              </div>
              <div
                class="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded-full text-[9px] font-semibold shadow"
                :class="estadoMesaBadgeClase(m.estado)"
              >
                {{ (m.estado || 'disponible') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Vista lista -->
        <div
          v-else
          class="divide-y divide-gray-200 bg-white rounded-xl border border-gray-200"
        >
          <div
            v-for="m in mesasConEstado"
            :key="m.id"
            class="flex items-center gap-3 px-3 sm:px-4 py-2.5 text-sm"
          >
            <div class="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-xs font-semibold text-gray-800">
              {{ m.numero_mesa }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                Mesa {{ m.numero_mesa }}
              </p>
              <p class="text-xs text-gray-600">
                Capacidad: {{ m.capacidad ?? 0 }} · Estado:
                <span :class="estadoMesaBadgeClase(m.estado)" class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ml-0.5">
                  {{ (m.estado || 'disponible') }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useMesasConEstado } from '@/composables/useMesasConEstado'
import { useAppImagesStore } from '@/stores/appImages'

const appImagesStore = useAppImagesStore()
const { mesasConEstado, loadingMesas, cargarMesas } = useMesasConEstado()
const vista = ref('grid') // 'grid' | 'lista'

const resumenMesas = computed(() => {
  const list = mesasConEstado.value || []
  return {
    disponibles: list.filter(m => (m.estado || 'disponible').toLowerCase() === 'disponible').length,
    reservadas: list.filter(m => (m.estado || '').toLowerCase() === 'reservado').length,
    ocupadas: list.filter(m => (m.estado || '').toLowerCase() === 'ocupado').length,
  }
})

function estadoMesaBadgeClase(estado) {
  const e = (estado || 'disponible').toLowerCase()
  if (e === 'ocupado') return 'bg-red-100 text-red-700'
  if (e === 'reservado') return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
}

onMounted(() => {
  cargarMesas()
})
</script>

