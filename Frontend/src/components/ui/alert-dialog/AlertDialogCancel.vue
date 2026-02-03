<template>
  <button
    type="button"
    class="btn-secondary mt-2 w-full sm:mt-0 sm:w-auto"
    @click="close"
  >
    <slot>Cancelar</slot>
  </button>
</template>

<script setup>
import { inject } from 'vue'

const setOpen = inject('alertDialogOpen')?.setOpen

function close() {
  setOpen?.(false)
}
</script>
