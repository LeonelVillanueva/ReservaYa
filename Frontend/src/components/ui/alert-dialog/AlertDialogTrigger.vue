<template>
  <span
    role="button"
    tabindex="0"
    class="inline-block"
    @click="openDialog"
    @keydown.enter.prevent="openDialog"
    @keydown.space.prevent="openDialog"
  >
    <slot />
  </span>
</template>

<script setup>
import { inject } from 'vue'

const { setOpen } = inject('alertDialogOpen')

function openDialog() {
  setOpen(true)
}
</script>
