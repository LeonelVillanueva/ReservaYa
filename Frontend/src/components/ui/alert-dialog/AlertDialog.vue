<template>
  <slot />
</template>

<script setup>
import { provide, ref } from 'vue'

const open = ref(false)

function setOpen(value) {
  open.value = value
}

provide('alertDialogOpen', { open, setOpen })
</script>
