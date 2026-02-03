<template>
  <Teleport to="body">
    <Transition name="alert-dialog">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @keydown.escape="close"
      >
        <div
          class="fixed inset-0 bg-black/50"
          aria-hidden="true"
          @click="close"
        />
        <div
          class="relative z-50 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          @click.stop
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { inject, provide, watch, onUnmounted } from 'vue'

const { open, setOpen } = inject('alertDialogOpen')

const titleId = `alert-dialog-title-${Math.random().toString(36).slice(2, 11)}`
const descriptionId = `alert-dialog-desc-${Math.random().toString(36).slice(2, 11)}`

provide('alertDialogIds', { titleId, descriptionId })
provide('alertDialogClose', () => setOpen(false))

function close() {
  setOpen(false)
}

// Cerrar con Escape
function onKeydown(e) {
  if (e.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.alert-dialog-enter-active,
.alert-dialog-leave-active {
  transition: opacity 0.2s ease;
}
.alert-dialog-enter-from,
.alert-dialog-leave-to {
  opacity: 0;
}
</style>
