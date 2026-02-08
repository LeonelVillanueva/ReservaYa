<template>
  <div class="p-4 sm:p-6">
    <div class="mb-4">
      <h1 class="text-xl font-bold text-gray-900">Menú del restaurante</h1>
      <p class="text-gray-600 text-sm">Gestiona categorías, platos e ingredientes.</p>
    </div>
    <MenuSection />
  </div>
</template>

<script setup>
import MenuSection from '@/components/menu/MenuSection.vue'
</script>
