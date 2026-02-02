<template>
  <div class="flex justify-center items-center" :class="sizeClass">
    <div class="animate-spin rounded-full border-2 border-primary-500 border-t-transparent" :class="spinnerSize"></div>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const sizeClass = {
  sm: 'p-4',
  md: 'p-8',
  lg: 'p-16'
}

const spinnerSize = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14'
}
</script>
