<template>
  <div class="card p-4">
    <h2 class="text-base font-semibold text-gray-900 mb-3">Menú del restaurante</h2>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-3 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px"
        :class="activeTab === tab.id
          ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50/50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
          :class="activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- ============ TAB: CATEGORÍAS ============ -->
    <div v-if="activeTab === 'categorias'">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-gray-500">Organiza los platos por categorías.</p>
        <button type="button" class="btn-primary text-xs" @click="showFormCategoria = true" v-if="!showFormCategoria">
          + Nueva categoría
        </button>
      </div>

      <!-- Form nueva categoría -->
      <Transition name="slide">
        <div v-if="showFormCategoria" class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input v-model="formCategoria.nombre" type="text" class="input text-sm" placeholder="Nombre *" />
            <input v-model="formCategoria.descripcion" type="text" class="input text-sm" placeholder="Descripción (opcional)" />
            <input v-model.number="formCategoria.orden" type="number" class="input text-sm" placeholder="Orden" min="0" />
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn-primary text-xs" :disabled="!formCategoria.nombre || savingCategoria" @click="guardarCategoria">
              {{ savingCategoria ? 'Guardando...' : (editingCategoriaId ? 'Actualizar' : 'Crear') }}
            </button>
            <button type="button" class="text-xs text-gray-500 hover:text-gray-700" @click="cancelarCategoria">Cancelar</button>
          </div>
          <p v-if="errorCategoria" class="text-xs text-red-500">{{ errorCategoria }}</p>
        </div>
      </Transition>

      <!-- Lista categorías -->
      <div v-if="loadingCategorias" class="text-gray-500 text-sm py-4">Cargando categorías...</div>
      <div v-else-if="categorias.length === 0" class="text-gray-400 text-sm py-4 text-center">No hay categorías. Crea la primera.</div>
      <div v-else class="space-y-1">
        <div
          v-for="cat in categorias"
          :key="cat.id"
          class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 group"
        >
          <div class="min-w-0">
            <span class="text-sm font-medium text-gray-900">{{ cat.nombre }}</span>
            <span v-if="cat.descripcion" class="ml-2 text-xs text-gray-400">{{ cat.descripcion }}</span>
            <span class="ml-2 text-[10px] text-gray-300">orden: {{ cat.orden ?? '-' }}</span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="text-xs text-primary-600 hover:text-primary-800 px-2 py-1" @click="editarCategoria(cat)">Editar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ TAB: PLATOS ============ -->
    <div v-if="activeTab === 'platos'">
      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <!-- Filtro por categoría -->
        <div class="flex items-center gap-2">
          <select v-model="filtroCategoria" class="input text-xs py-1.5 w-auto">
            <option value="">Todas las categorías</option>
            <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
          </select>
          <span class="text-xs text-gray-400">{{ platosFiltrados.length }} platos</span>
        </div>
        <button type="button" class="btn-primary text-xs" @click="abrirFormPlato()">+ Nuevo plato</button>
      </div>

      <!-- Lista platos -->
      <div v-if="loadingPlatos" class="text-gray-500 text-sm py-4">Cargando platos...</div>
      <div v-else-if="platosFiltrados.length === 0" class="text-gray-400 text-sm py-4 text-center">No hay platos{{ filtroCategoria ? ' en esta categoría' : '' }}.</div>
      <div v-else class="space-y-1.5">
        <div
          v-for="plato in platosFiltrados"
          :key="plato.id"
          class="flex items-center gap-3 py-2 px-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
        >
          <!-- Imagen miniatura -->
          <div class="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
            <img v-if="plato.imagen_url" :src="plato.imagen_url" :alt="plato.nombre" class="w-full h-full object-cover" />
            <svg v-else class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 truncate">{{ plato.nombre }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{{ plato.categoria?.nombre || 'Sin categoría' }}</span>
            </div>
            <p v-if="plato.descripcion" class="text-xs text-gray-400 truncate mt-0.5">{{ plato.descripcion }}</p>
          </div>

          <!-- Precio -->
          <span class="text-sm font-semibold text-gray-700 shrink-0">L {{ Number(plato.precio || 0).toFixed(2) }}</span>

          <!-- Toggle disponibilidad -->
          <button
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
            :class="plato.disponible ? 'bg-accent-500' : 'bg-gray-300'"
            :title="plato.disponible ? 'Disponible — click para desactivar' : 'No disponible — click para activar'"
            @click="toggleDisponibilidad(plato)"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
              :class="plato.disponible ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>

          <!-- Editar -->
          <button type="button" class="text-xs text-primary-600 hover:text-primary-800 px-1 opacity-0 group-hover:opacity-100 transition-opacity" @click="abrirFormPlato(plato)">
            Editar
          </button>
        </div>
      </div>

      <!-- Modal/Formulario de plato -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showFormPlato" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40" @click="cerrarFormPlato" />
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingPlatoId ? 'Editar plato' : 'Nuevo plato' }}</h3>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                  <input v-model="formPlato.nombre" type="text" class="input text-sm" placeholder="Ej: Baleada especial" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea v-model="formPlato.descripcion" class="input text-sm" rows="2" placeholder="Describe el plato, cómo está hecho..." />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Precio (LPS) *</label>
                    <input v-model.number="formPlato.precio" type="number" min="0" step="0.01" class="input text-sm" placeholder="0.00" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
                    <select v-model.number="formPlato.categoria_id" class="input text-sm">
                      <option :value="null" disabled>Seleccionar...</option>
                      <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
                    </select>
                  </div>
                </div>

                <!-- Imagen -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Imagen</label>
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                      <img v-if="platoImgPreview || formPlato.imagen_url" :src="platoImgPreview || formPlato.imagen_url" class="w-full h-full object-cover" />
                      <svg v-else class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <label class="btn-secondary text-xs cursor-pointer" :class="{ 'opacity-50 pointer-events-none': uploadingPlatoImg }">
                      {{ uploadingPlatoImg ? 'Subiendo...' : 'Subir imagen' }}
                      <input type="file" accept="image/*" class="hidden" @change="onUploadPlatoImg" :disabled="uploadingPlatoImg" />
                    </label>
                  </div>
                  <p v-if="errorPlatoImg" class="text-xs text-red-500 mt-1">{{ errorPlatoImg }}</p>
                </div>

                <!-- Ingredientes -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Ingredientes</label>
                  <div class="flex flex-wrap gap-1.5 mb-2">
                    <span
                      v-for="ing in formPlato.ingredientes"
                      :key="ing.ingrediente_id"
                      class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                      :class="getIngrediente(ing.ingrediente_id)?.es_alergeno ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-700'"
                    >
                      {{ getIngrediente(ing.ingrediente_id)?.nombre || 'Ingrediente' }}
                      <span v-if="getIngrediente(ing.ingrediente_id)?.es_alergeno" class="text-[9px] font-semibold">ALÉRGENO</span>
                      <button type="button" class="text-gray-400 hover:text-red-500 ml-0.5" @click="quitarIngrediente(ing.ingrediente_id)">&times;</button>
                    </span>
                    <span v-if="formPlato.ingredientes.length === 0" class="text-xs text-gray-400">Ninguno seleccionado</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <select v-model.number="ingredienteSeleccionado" class="input text-xs py-1.5 flex-1">
                      <option :value="null" disabled>Agregar ingrediente...</option>
                      <option
                        v-for="ing in ingredientesDisponibles"
                        :key="ing.id"
                        :value="ing.id"
                      >{{ ing.nombre }}{{ ing.es_alergeno ? ' (alérgeno)' : '' }}</option>
                    </select>
                    <button type="button" class="btn-secondary text-xs shrink-0" :disabled="!ingredienteSeleccionado" @click="agregarIngrediente">
                      Agregar
                    </button>
                  </div>
                </div>

                <!-- Disponible -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="formPlato.disponible" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4" />
                  <span class="text-sm text-gray-700">Disponible en el menú</span>
                </label>
              </div>

              <!-- Acciones -->
              <div class="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" class="btn-secondary text-sm" @click="cerrarFormPlato">Cancelar</button>
                <button
                  type="button"
                  class="btn-primary text-sm"
                  :disabled="!formPlatoValido || savingPlato"
                  @click="guardarPlato"
                >
                  {{ savingPlato ? 'Guardando...' : (editingPlatoId ? 'Actualizar' : 'Crear plato') }}
                </button>
              </div>
              <p v-if="errorPlato" class="mt-2 text-xs text-red-500">{{ errorPlato }}</p>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- ============ TAB: INGREDIENTES ============ -->
    <div v-if="activeTab === 'ingredientes'">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-gray-500">Ingredientes disponibles para asociar a platos.</p>
        <button type="button" class="btn-primary text-xs" @click="showFormIngrediente = true" v-if="!showFormIngrediente">
          + Nuevo ingrediente
        </button>
      </div>

      <!-- Form nuevo ingrediente -->
      <Transition name="slide">
        <div v-if="showFormIngrediente" class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div class="flex items-center gap-2">
            <input v-model="formIngrediente.nombre" type="text" class="input text-sm flex-1" placeholder="Nombre del ingrediente *" />
            <label class="flex items-center gap-1.5 cursor-pointer shrink-0">
              <input v-model="formIngrediente.es_alergeno" type="checkbox" class="rounded border-gray-300 text-orange-500 focus:ring-orange-400 h-4 w-4" />
              <span class="text-xs text-gray-700">Alérgeno</span>
            </label>
            <button type="button" class="btn-primary text-xs" :disabled="!formIngrediente.nombre || savingIngrediente" @click="guardarIngrediente">
              {{ savingIngrediente ? '...' : 'Crear' }}
            </button>
            <button type="button" class="text-xs text-gray-500 hover:text-gray-700" @click="cancelarIngrediente">Cancelar</button>
          </div>
          <p v-if="errorIngrediente" class="text-xs text-red-500 mt-1">{{ errorIngrediente }}</p>
        </div>
      </Transition>

      <!-- Lista ingredientes -->
      <div v-if="loadingIngredientes" class="text-gray-500 text-sm py-4">Cargando ingredientes...</div>
      <div v-else-if="ingredientes.length === 0" class="text-gray-400 text-sm py-4 text-center">No hay ingredientes.</div>
      <div v-else class="flex flex-wrap gap-1.5">
        <span
          v-for="ing in ingredientes"
          :key="ing.id"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border"
          :class="ing.es_alergeno ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-700'"
        >
          {{ ing.nombre }}
          <span v-if="ing.es_alergeno" class="text-[9px] font-bold uppercase text-orange-500">alérgeno</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { menuApi, storageApi } from '@/api'

// === Estado general ===
const activeTab = ref('platos')

// === Categorías ===
const categorias = ref([])
const loadingCategorias = ref(true)
const showFormCategoria = ref(false)
const savingCategoria = ref(false)
const errorCategoria = ref('')
const editingCategoriaId = ref(null)
const formCategoria = ref({ nombre: '', descripcion: '', orden: 0 })

async function cargarCategorias() {
  loadingCategorias.value = true
  try {
    const data = await menuApi.getCategorias()
    categorias.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error cargando categorías:', err)
  } finally {
    loadingCategorias.value = false
  }
}

function editarCategoria(cat) {
  editingCategoriaId.value = cat.id
  formCategoria.value = { nombre: cat.nombre, descripcion: cat.descripcion || '', orden: cat.orden ?? 0 }
  showFormCategoria.value = true
}

function cancelarCategoria() {
  showFormCategoria.value = false
  editingCategoriaId.value = null
  formCategoria.value = { nombre: '', descripcion: '', orden: 0 }
  errorCategoria.value = ''
}

async function guardarCategoria() {
  if (!formCategoria.value.nombre) return
  savingCategoria.value = true
  errorCategoria.value = ''
  try {
    if (editingCategoriaId.value) {
      await menuApi.updateCategoria(editingCategoriaId.value, formCategoria.value)
    } else {
      await menuApi.createCategoria(formCategoria.value)
    }
    await cargarCategorias()
    cancelarCategoria()
  } catch (err) {
    errorCategoria.value = err?.error || err?.message || 'Error al guardar categoría'
  } finally {
    savingCategoria.value = false
  }
}

// === Platos ===
const platos = ref([])
const loadingPlatos = ref(true)
const filtroCategoria = ref('')
const showFormPlato = ref(false)
const savingPlato = ref(false)
const errorPlato = ref('')
const editingPlatoId = ref(null)
const uploadingPlatoImg = ref(false)
const errorPlatoImg = ref('')
const platoImgPreview = ref(null)
const ingredienteSeleccionado = ref(null)

const formPlato = ref({
  nombre: '',
  descripcion: '',
  precio: null,
  categoria_id: null,
  imagen_url: '',
  disponible: true,
  ingredientes: [], // [{ ingrediente_id, cantidad }]
})

const platosFiltrados = computed(() => {
  if (!filtroCategoria.value) return platos.value
  return platos.value.filter(p => p.categoria_id === Number(filtroCategoria.value))
})

const formPlatoValido = computed(() => {
  return formPlato.value.nombre && formPlato.value.precio > 0 && formPlato.value.categoria_id
})

const ingredientesDisponibles = computed(() => {
  const idsUsados = new Set(formPlato.value.ingredientes.map(i => i.ingrediente_id))
  return ingredientes.value.filter(i => !idsUsados.has(i.id))
})

async function cargarPlatos() {
  loadingPlatos.value = true
  try {
    const data = await menuApi.getPlatos()
    platos.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error cargando platos:', err)
  } finally {
    loadingPlatos.value = false
  }
}

function abrirFormPlato(plato = null) {
  errorPlato.value = ''
  errorPlatoImg.value = ''
  platoImgPreview.value = null
  ingredienteSeleccionado.value = null

  if (plato) {
    editingPlatoId.value = plato.id
    formPlato.value = {
      nombre: plato.nombre,
      descripcion: plato.descripcion || '',
      precio: plato.precio,
      categoria_id: plato.categoria_id,
      imagen_url: plato.imagen_url || '',
      disponible: plato.disponible ?? true,
      ingredientes: plato.ingredientes?.map(i => ({
        ingrediente_id: i.ingrediente?.id || i.ingrediente_id,
        cantidad: i.cantidad || '',
      })) || [],
    }
  } else {
    editingPlatoId.value = null
    formPlato.value = {
      nombre: '',
      descripcion: '',
      precio: null,
      categoria_id: categorias.value[0]?.id || null,
      imagen_url: '',
      disponible: true,
      ingredientes: [],
    }
  }
  showFormPlato.value = true
}

function cerrarFormPlato() {
  showFormPlato.value = false
  editingPlatoId.value = null
  platoImgPreview.value = null
}

async function onUploadPlatoImg(event) {
  const file = event.target.files?.[0]
  if (!file) return
  errorPlatoImg.value = ''
  uploadingPlatoImg.value = true
  platoImgPreview.value = URL.createObjectURL(file)
  try {
    const oldUrl = formPlato.value.imagen_url
    const response = await storageApi.upload('platos', file)
    const url = response?.data?.url || response?.url || null
    if (!url) throw new Error('No se recibió URL')
    formPlato.value.imagen_url = url
    // Eliminar la imagen anterior del bucket
    if (oldUrl) await storageApi.deleteByUrl(oldUrl)
  } catch (err) {
    errorPlatoImg.value = err?.error || err?.message || 'Error al subir imagen'
    platoImgPreview.value = null
  } finally {
    uploadingPlatoImg.value = false
    event.target.value = ''
  }
}

function agregarIngrediente() {
  if (!ingredienteSeleccionado.value) return
  formPlato.value.ingredientes.push({
    ingrediente_id: ingredienteSeleccionado.value,
    cantidad: '',
  })
  ingredienteSeleccionado.value = null
}

function quitarIngrediente(ingredienteId) {
  formPlato.value.ingredientes = formPlato.value.ingredientes.filter(i => i.ingrediente_id !== ingredienteId)
}

function getIngrediente(id) {
  return ingredientes.value.find(i => i.id === id)
}

async function guardarPlato() {
  if (!formPlatoValido.value) return
  savingPlato.value = true
  errorPlato.value = ''
  try {
    const payload = {
      nombre: formPlato.value.nombre,
      descripcion: formPlato.value.descripcion,
      precio: formPlato.value.precio,
      categoria_id: formPlato.value.categoria_id,
      imagen_url: formPlato.value.imagen_url || null,
      disponible: formPlato.value.disponible,
      ingredientes: formPlato.value.ingredientes.map(i => ({
        ingrediente_id: i.ingrediente_id,
        cantidad: i.cantidad || null,
      })),
    }

    if (editingPlatoId.value) {
      await menuApi.updatePlato(editingPlatoId.value, payload)
    } else {
      await menuApi.createPlato(payload)
    }
    await cargarPlatos()
    cerrarFormPlato()
  } catch (err) {
    errorPlato.value = err?.error || err?.message || 'Error al guardar plato'
  } finally {
    savingPlato.value = false
  }
}

async function toggleDisponibilidad(plato) {
  const nuevoValor = !plato.disponible
  try {
    await menuApi.toggleDisponibilidad(plato.id, nuevoValor)
    plato.disponible = nuevoValor
  } catch (err) {
    console.error('Error al cambiar disponibilidad:', err)
  }
}

// === Ingredientes ===
const ingredientes = ref([])
const loadingIngredientes = ref(true)
const showFormIngrediente = ref(false)
const savingIngrediente = ref(false)
const errorIngrediente = ref('')
const formIngrediente = ref({ nombre: '', es_alergeno: false })

async function cargarIngredientes() {
  loadingIngredientes.value = true
  try {
    const data = await menuApi.getIngredientes()
    ingredientes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error cargando ingredientes:', err)
  } finally {
    loadingIngredientes.value = false
  }
}

function cancelarIngrediente() {
  showFormIngrediente.value = false
  formIngrediente.value = { nombre: '', es_alergeno: false }
  errorIngrediente.value = ''
}

async function guardarIngrediente() {
  if (!formIngrediente.value.nombre) return
  savingIngrediente.value = true
  errorIngrediente.value = ''
  try {
    await menuApi.createIngrediente(formIngrediente.value)
    await cargarIngredientes()
    cancelarIngrediente()
  } catch (err) {
    errorIngrediente.value = err?.error || err?.message || 'Error al crear ingrediente'
  } finally {
    savingIngrediente.value = false
  }
}

// === Tabs ===
const tabs = computed(() => [
  { id: 'categorias', label: 'Categorías', count: categorias.value.length },
  { id: 'platos', label: 'Platos', count: platos.value.length },
  { id: 'ingredientes', label: 'Ingredientes', count: ingredientes.value.length },
])

// === Init ===
onMounted(() => {
  cargarCategorias()
  cargarPlatos()
  cargarIngredientes()
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
