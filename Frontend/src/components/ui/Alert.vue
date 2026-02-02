<template>
  <div
    role="alert"
    :class="[
      'max-w-md w-full flex items-start gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm',
      variantClasses[variant] || variantClasses.default,
    ]"
  >
    <div class="mt-0.5">
      <slot name="icon">
        <!-- Ícono por defecto según variante -->
        <svg
          v-if="variant === 'destructive'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-red-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
        </svg>
        <svg
          v-else-if="variant === 'warning'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-amber-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="m4.93 19h14.14a2 2 0 0 0 1.73-3l-7.07-12a2 2 0 0 0-3.46 0l-7.07 12a2 2 0 0 0 1.73 3Z" />
        </svg>
        <svg
          v-else-if="variant === 'info'"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-sky-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </slot>
    </div>
    <div class="space-y-0.5">
      <p v-if="title" class="font-semibold leading-none tracking-tight">
        <slot name="title">{{ title }}</slot>
      </p>
      <p
        class="text-xs leading-snug"
        :class="
          variant === 'destructive'
            ? 'text-red-700'
            : variant === 'warning'
              ? 'text-amber-800'
              : variant === 'info'
                ? 'text-sky-800'
                : 'text-gray-700'
        "
      >
        <slot />
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default', // default | success | destructive | warning | info
  },
  title: {
    type: String,
    default: '',
  },
})

const variantClasses = {
  default: 'border-gray-200 bg-white text-gray-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  destructive: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

const variant = computed(() => props.variant)
const title = computed(() => props.title)
</script>

