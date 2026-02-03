<template>
  <button
    type="button"
    class="btn-primary w-full sm:w-auto"
    @click="handleClick"
  >
    <slot>Continuar</slot>
  </button>
</template>

<script setup>
import { inject } from 'vue'

const setOpen = inject('alertDialogOpen')?.setOpen

const emit = defineEmits(['click'])

function handleClick(e) {
  emit('click', e)
  setOpen?.(false)
}
</script>
