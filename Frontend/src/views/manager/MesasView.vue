<template>
  <div class="mesas-view p-6 sm:p-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Gestión de mesas</h1>
          <p class="text-gray-600 text-sm mt-1">Añade o retira mesas del restaurante.</p>
        </div>
        <button
          type="button"
          class="btn-primary"
          :disabled="loading || saving"
          @click="mostrarFormNuevaMesa"
        >
          + Añadir mesa
        </button>
      </div>

      <!-- Modal: nueva mesa -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showFormNuevaMesa"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nueva-mesa-title"
          >
            <div class="fixed inset-0 bg-black/50" aria-hidden="true" @click="cerrarFormNuevaMesa" />
            <div
              class="relative z-50 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
              @click.stop
            >
              <h2 id="nueva-mesa-title" class="text-lg font-semibold text-gray-900 mb-4">Nueva mesa</h2>
              <form @submit.prevent="crearMesaDesdeForm" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Máximo de personas</label>
                  <input
                    v-model.number="formNuevaMesa.capacidad"
                    type="number"
                    min="1"
                    max="20"
                    class="input w-full"
                    required
                  />
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model="formNuevaMesa.combinable"
                    type="checkbox"
                    id="nueva-mesa-combinable"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label for="nueva-mesa-combinable" class="text-sm text-gray-700">Mesa combinable (se puede unir con otra)</label>
                </div>
                <div class="flex gap-2 pt-2">
                  <button type="submit" class="btn-primary flex-1" :disabled="saving">
                    {{ saving ? 'Creando...' : 'Crear mesa' }}
                  </button>
                  <button type="button" class="btn-secondary" @click="cerrarFormNuevaMesa">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <div v-if="loading" class="text-center py-12 text-gray-500">Cargando mesas...</div>
      <div v-else-if="!mesas.length" class="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
        No hay mesas. Haz clic en "Añadir mesa" para crear una.
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="m in mesas"
          :key="m.id"
          class="flex flex-col rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group"
        >
          <span class="text-center text-sm font-semibold text-gray-900 py-1">Mesa {{ m.numero_mesa }}</span>
          <div class="relative flex-1 aspect-square">
            <img
              :src="appImagesStore.mesaUrl"
              :alt="'Mesa ' + m.numero_mesa"
              class="w-full h-full object-contain"
            />
            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow bg-gray-100 text-gray-700">
              {{ m.capacidad ?? 4 }} pers.
            </div>
            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 shadow">
              Disponible
            </div>
            <AlertDialog>
              <AlertDialogTrigger>
                <button
                  type="button"
                  class="absolute top-1 right-1 w-8 h-8 rounded-full flex items-center justify-center bg-red-500/90 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-lg leading-none"
                  title="Retirar mesa"
                  :disabled="saving"
                >
                  ×
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirar mesa</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Retirar la Mesa {{ m.numero_mesa }}? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction @click="confirmarRetirarMesa(m)">
                    Retirar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { mesasApi } from '@/api'
import { invalidateMesasCache } from '@/composables/useMesasConEstado'
import { useAppImagesStore } from '@/stores/appImages'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

const appImagesStore = useAppImagesStore()

const mesas = ref([])
const loading = ref(true)
const saving = ref(false)
const showFormNuevaMesa = ref(false)
const formNuevaMesa = ref({
  capacidad: 4,
  combinable: false,
})

async function cargarMesas() {
  loading.value = true
  try {
    const data = await mesasApi.getAll()
    mesas.value = data || []
  } catch {
    mesas.value = []
  } finally {
    loading.value = false
  }
}

function siguienteNumero() {
  if (!mesas.value.length) return 1
  const nums = mesas.value.map((m) => parseInt(m.numero_mesa, 10) || 0)
  return Math.max(...nums) + 1
}

function mostrarFormNuevaMesa() {
  formNuevaMesa.value = { capacidad: 4, combinable: false }
  showFormNuevaMesa.value = true
}

function cerrarFormNuevaMesa() {
  showFormNuevaMesa.value = false
}

async function crearMesaDesdeForm() {
  saving.value = true
  try {
    const numero = siguienteNumero()
    const capacidad = Math.min(20, Math.max(1, formNuevaMesa.value.capacidad || 4))
    await mesasApi.create({
      numero_mesa: String(numero),
      capacidad,
      combinable: !!formNuevaMesa.value.combinable,
      activa: true,
    })
    invalidateMesasCache()
    await cargarMesas()
    cerrarFormNuevaMesa()
  } catch (err) {
    alert(err?.error || err?.message || 'Error al añadir mesa')
  } finally {
    saving.value = false
  }
}

async function confirmarRetirarMesa(mesa) {
  saving.value = true
  try {
    await mesasApi.delete(mesa.id)
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    alert(err?.error || err?.message || 'Error al retirar mesa')
  } finally {
    saving.value = false
  }
}

onMounted(cargarMesas)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
