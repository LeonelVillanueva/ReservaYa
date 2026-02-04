<template>
  <span class="inline-flex shrink-0" :class="claseColor" aria-hidden="true">
    <!-- Disponible: checkmark -->
    <svg v-if="estadoNorm === 'disponible'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    <!-- Reservado: clock -->
    <svg v-else-if="estadoNorm === 'reservado'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <!-- Ocupado: X -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: { type: String, default: 'disponible' }
})

const estadoNorm = computed(() => (props.estado || 'disponible').toLowerCase())

const claseColor = computed(() => {
  const e = estadoNorm.value
  if (e === 'ocupado') return 'text-red-600'
  if (e === 'reservado') return 'text-orange-500'
  return 'text-green-600'
})
</script>
