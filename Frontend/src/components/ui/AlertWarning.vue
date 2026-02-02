<template>
  <Alert variant="warning" v-bind="$attrs">
    <slot />
  </Alert>
</template>

<script setup>
import Alert from './Alert.vue'
</script>

