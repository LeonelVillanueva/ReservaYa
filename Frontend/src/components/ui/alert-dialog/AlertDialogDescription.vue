<template>
  <p :id="descriptionId" class="text-sm text-gray-500">
    <slot />
  </p>
</template>

<script setup>
import { inject } from 'vue'

const { descriptionId } = inject('alertDialogIds', { descriptionId: 'alert-dialog-desc' })
</script>
