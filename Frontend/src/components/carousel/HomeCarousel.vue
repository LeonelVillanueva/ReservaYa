<template>
  <div v-if="imagenes.length > 0" class="relative rounded-xl overflow-hidden shadow-md group bg-gray-900">
    <!-- Slides -->
    <div class="relative w-full" :style="{ aspectRatio: '16/6' }">
      <!-- Fondo difuminado (la misma imagen como backdrop) -->
      <img
        :key="'bg-' + currentIndex"
        :src="imagenes[currentIndex]"
        aria-hidden="true"
        class="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40"
      />
      <transition :name="transitionName" mode="out-in">
        <img
          :key="currentIndex"
          :src="imagenes[currentIndex]"
          alt="Imagen del restaurante"
          class="absolute inset-0 w-full h-full object-contain"
        />
      </transition>
    </div>

    <!-- Flechas de navegación -->
    <button
      v-if="imagenes.length > 1"
      type="button"
      class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      @click="prev"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      v-if="imagenes.length > 1"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      @click="next"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Dots -->
    <div v-if="imagenes.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
      <button
        v-for="(_, i) in imagenes"
        :key="i"
        type="button"
        class="w-2 h-2 rounded-full transition-all"
        :class="i === currentIndex ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80'"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  imagenes: { type: Array, default: () => [] },
  intervalo: { type: Number, default: 5 }, // segundos
})

const currentIndex = ref(0)
const transitionName = ref('slide-right')
let timer = null

function next() {
  transitionName.value = 'slide-right'
  currentIndex.value = (currentIndex.value + 1) % props.imagenes.length
}

function prev() {
  transitionName.value = 'slide-left'
  currentIndex.value = (currentIndex.value - 1 + props.imagenes.length) % props.imagenes.length
}

function goTo(index) {
  transitionName.value = index > currentIndex.value ? 'slide-right' : 'slide-left'
  currentIndex.value = index
}

function startTimer() {
  stopTimer()
  if (props.imagenes.length > 1 && props.intervalo > 0) {
    timer = setInterval(next, props.intervalo * 1000)
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(() => [props.imagenes.length, props.intervalo], () => {
  currentIndex.value = 0
  startTimer()
})

onMounted(startTimer)
onUnmounted(stopTimer)
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
