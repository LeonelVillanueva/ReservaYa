<template>
  <Alert variant="info" v-bind="$attrs">
    <slot />
  </Alert>
</template>

<script setup>
import Alert from './Alert.vue'
</script>

