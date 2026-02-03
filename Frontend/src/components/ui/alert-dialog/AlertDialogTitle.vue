<template>
  <h2 :id="titleId" class="text-lg font-semibold text-gray-900">
    <slot />
  </h2>
</template>

<script setup>
import { inject } from 'vue'

const { titleId } = inject('alertDialogIds', { titleId: 'alert-dialog-title' })
</script>
