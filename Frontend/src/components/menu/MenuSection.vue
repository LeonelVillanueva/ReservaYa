<template>
  <div class="card p-4 sm:p-5">
    <h2 class="text-base font-semibold text-gray-900 mb-1">Menú del restaurante</h2>
    <p class="text-xs text-gray-400 mb-4">Configura alergias, ingredientes, categorías y platos siguiendo el flujo.</p>

    <!-- ===== STEPPER TABS ===== -->
    <div class="flex items-center gap-0 mb-5 overflow-x-auto pb-1">
      <template v-for="(tab, idx) in tabs" :key="tab.id">
        <!-- Conector -->
        <div v-if="idx > 0" class="hidden sm:block w-6 h-px shrink-0" :class="stepIndex >= idx ? 'bg-primary-300' : 'bg-gray-200'" />

        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
          :class="activeTab === tab.id
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : stepIndex > idx
              ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
          @click="activeTab = tab.id"
        >
          <!-- Número del paso / check si completo -->
          <span
            class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
            :class="activeTab === tab.id
              ? 'bg-white/20 text-white'
              : stepIndex > idx
                ? 'bg-primary-200 text-primary-700'
                : 'bg-gray-200 text-gray-500'"
          >
            <svg v-if="stepIndex > idx && activeTab !== tab.id" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
            <template v-else>{{ idx + 1 }}</template>
          </span>

          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span class="sm:hidden">{{ tab.short }}</span>

          <span
            v-if="tab.count > 0"
            class="text-[10px] px-1.5 py-0.5 rounded-full"
            :class="activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-500'"
          >{{ tab.count }}</span>
        </button>
      </template>
    </div>

    <!-- ===== TOAST de éxito ===== -->
    <Transition name="slide">
      <div v-if="successMsg" class="mb-4 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <svg class="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span class="text-xs text-green-700 font-medium">{{ successMsg }}</span>
      </div>
    </Transition>

    <!-- ============================================================ -->
    <!-- TAB 1: ALERGIAS                                              -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'alergias'">
      <!-- Formulario siempre visible para entrada rápida -->
      <div class="mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
        <p class="text-xs font-semibold text-orange-800 mb-2">
          {{ editingAlergiaId ? 'Editar alergia' : 'Agregar alergia' }}
        </p>
        <div class="flex items-center gap-2">
          <input
            ref="alergiaInputRef"
            v-model="formAlergia.nombre"
            type="text"
            class="input text-sm flex-1"
            placeholder="Ej: Gluten, Lácteos, Mariscos, Frutos secos..."
            @keydown.enter="guardarAlergia"
          />
          <button
            type="button"
            class="btn-primary text-xs shrink-0"
            :disabled="!formAlergia.nombre.trim() || savingAlergia"
            @click="guardarAlergia"
          >
            {{ savingAlergia ? '...' : (editingAlergiaId ? 'Actualizar' : 'Agregar') }}
          </button>
          <button
            v-if="editingAlergiaId"
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700 shrink-0"
            @click="cancelarAlergia"
          >Cancelar</button>
        </div>
        <p v-if="errorAlergia" class="text-xs text-red-500 mt-1">{{ errorAlergia }}</p>
        <p v-if="!editingAlergiaId" class="text-[11px] text-orange-600/70 mt-1.5">
          Presiona Enter o click en Agregar. El campo se limpia para seguir agregando.
        </p>
      </div>

      <!-- Lista alergias -->
      <div v-if="menuStore.loadingAlergias" class="text-gray-500 text-sm py-6 text-center">Cargando alergias...</div>
      <div v-else-if="menuStore.alergias.length === 0" class="flex flex-col items-center py-8 text-gray-400">
        <svg class="w-10 h-10 mb-2 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        <p class="text-sm">Aún no hay alergias registradas</p>
        <p class="text-xs mt-1">Usa el formulario de arriba para agregar la primera.</p>
      </div>
      <div v-else class="space-y-1">
        <div
          v-for="al in menuStore.alergias"
          :key="al.id"
          class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 group transition-colors"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0 ring-2 ring-orange-100"></span>
            <span class="text-sm font-medium text-gray-900">{{ al.nombre }}</span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded hover:bg-primary-50 transition-colors" @click="editarAlergia(al)">Editar</button>
            <AlertDialog>
              <AlertDialogTrigger>
                <button type="button" class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">Eliminar</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar alergia</AlertDialogTitle>
                  <AlertDialogDescription>¿Eliminar la alergia "{{ al.nombre }}"? Si está asociada a ingredientes, no se podrá eliminar.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction @click="eliminarAlergia(al)" class="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <!-- Banner siguiente paso -->
      <div v-if="menuStore.alergias.length > 0" class="mt-5 flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-xl">
        <p class="text-xs text-primary-700">
          <span class="font-semibold">{{ menuStore.alergias.length }} alergia{{ menuStore.alergias.length !== 1 ? 's' : '' }}</span> registradas.
          Continúa creando ingredientes.
        </p>
        <button type="button" class="btn-primary text-xs" @click="activeTab = 'ingredientes'">
          Siguiente: Ingredientes &rarr;
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 2: INGREDIENTES                                          -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'ingredientes'">
      <!-- Alerta si no hay alergias -->
      <div v-if="menuStore.alergias.length === 0" class="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p class="text-xs text-amber-700">
          No hay alergias registradas. Los ingredientes no tendrán alergias asociadas.
          <button type="button" class="font-semibold underline ml-1" @click="activeTab = 'alergias'">Crear alergias primero</button>
        </p>
      </div>

      <!-- Formulario rápido -->
      <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <p class="text-xs font-semibold text-blue-800 mb-2">
          {{ editingIngredienteId ? 'Editar ingrediente' : 'Agregar ingrediente' }}
        </p>
        <div class="flex items-center gap-2 mb-2">
          <input
            ref="ingredienteInputRef"
            v-model="formIngrediente.nombre"
            type="text"
            class="input text-sm flex-1"
            placeholder="Nombre del ingrediente (ej: Harina de trigo, Leche entera...)"
            @keydown.enter="guardarIngrediente"
          />
          <button
            type="button"
            class="btn-primary text-xs shrink-0"
            :disabled="!formIngrediente.nombre.trim() || savingIngrediente"
            @click="guardarIngrediente"
          >
            {{ savingIngrediente ? '...' : (editingIngredienteId ? 'Actualizar' : 'Agregar') }}
          </button>
          <button
            v-if="editingIngredienteId"
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700 shrink-0"
            @click="cancelarIngrediente"
          >Cancelar</button>
        </div>

        <!-- Chips de alergias -->
        <div v-if="menuStore.alergias.length > 0">
          <p class="text-[11px] text-blue-700/70 mb-1.5">Selecciona las alergias que aplican a este ingrediente:</p>
          <div class="flex flex-wrap gap-1.5">
            <label
              v-for="al in menuStore.alergias"
              :key="al.id"
              class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border cursor-pointer transition-all select-none"
              :class="formIngrediente.alergia_ids.includes(al.id)
                ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-sm scale-105'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'"
            >
              <input type="checkbox" :value="al.id" v-model="formIngrediente.alergia_ids" class="hidden" />
              <span v-if="formIngrediente.alergia_ids.includes(al.id)" class="text-orange-500">&#10003;</span>
              {{ al.nombre }}
            </label>
          </div>
        </div>

        <p v-if="errorIngrediente" class="text-xs text-red-500 mt-1.5">{{ errorIngrediente }}</p>
      </div>

      <!-- Lista ingredientes -->
      <div v-if="menuStore.loadingIngredientes" class="text-gray-500 text-sm py-6 text-center">Cargando ingredientes...</div>
      <div v-else-if="menuStore.ingredientes.length === 0" class="flex flex-col items-center py-8 text-gray-400">
        <svg class="w-10 h-10 mb-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        <p class="text-sm">Aún no hay ingredientes</p>
        <p class="text-xs mt-1">Usa el formulario de arriba para agregar el primero.</p>
      </div>
      <div v-else class="flex flex-wrap gap-1.5">
        <span
          v-for="ing in menuStore.ingredientes"
          :key="ing.id"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border group transition-all hover:shadow-sm"
          :class="ing.es_alergeno ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-700'"
        >
          {{ ing.nombre }}
          <template v-if="ing.alergias && ing.alergias.length > 0">
            <span
              v-for="al in ing.alergias"
              :key="al.id"
              class="text-[9px] font-bold uppercase text-orange-500 bg-orange-100 px-1 py-0.5 rounded"
            >{{ al.nombre }}</span>
          </template>
          <span v-else-if="ing.es_alergeno" class="text-[9px] font-bold uppercase text-orange-500">alérgeno</span>

          <button type="button" class="text-gray-400 hover:text-primary-600 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Editar" @click="editarIngrediente(ing)">&#9998;</button>
          <AlertDialog>
            <AlertDialogTrigger>
              <button type="button" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar">&times;</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar ingrediente</AlertDialogTitle>
                <AlertDialogDescription>¿Eliminar el ingrediente "{{ ing.nombre }}"? Si está asociado a platos, no se podrá eliminar.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction @click="eliminarIngrediente(ing)" class="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </span>
      </div>

      <!-- Banner siguiente paso -->
      <div v-if="menuStore.ingredientes.length > 0" class="mt-5 flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-xl">
        <p class="text-xs text-primary-700">
          <span class="font-semibold">{{ menuStore.ingredientes.length }} ingrediente{{ menuStore.ingredientes.length !== 1 ? 's' : '' }}</span> registrados.
          Continúa organizando categorías.
        </p>
        <button type="button" class="btn-primary text-xs" @click="activeTab = 'categorias'">
          Siguiente: Categorías &rarr;
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 3: CATEGORÍAS                                            -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'categorias'">
      <!-- Formulario rápido -->
      <div class="mb-4 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
        <p class="text-xs font-semibold text-violet-800 mb-2">
          {{ editingCategoriaId ? 'Editar categoría' : 'Agregar categoría' }}
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px] gap-2 mb-2">
          <input
            ref="categoriaInputRef"
            v-model="formCategoria.nombre"
            type="text"
            class="input text-sm"
            placeholder="Nombre (ej: Entradas, Platos fuertes, Postres) *"
            @keydown.enter="guardarCategoria"
          />
          <input v-model="formCategoria.descripcion" type="text" class="input text-sm" placeholder="Descripción (opcional)" />
          <input v-model.number="formCategoria.orden" type="number" class="input text-sm" placeholder="Orden" min="0" />
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-primary text-xs"
            :disabled="!formCategoria.nombre.trim() || savingCategoria"
            @click="guardarCategoria"
          >
            {{ savingCategoria ? '...' : (editingCategoriaId ? 'Actualizar' : 'Agregar') }}
          </button>
          <button
            v-if="editingCategoriaId"
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700"
            @click="cancelarCategoria"
          >Cancelar</button>
          <p v-if="!editingCategoriaId" class="text-[11px] text-violet-600/60 ml-2">Enter para agregar rápido</p>
        </div>
        <p v-if="errorCategoria" class="text-xs text-red-500 mt-1">{{ errorCategoria }}</p>
      </div>

      <!-- Lista categorías -->
      <div v-if="menuStore.loadingCategorias" class="text-gray-500 text-sm py-6 text-center">Cargando categorías...</div>
      <div v-else-if="menuStore.categorias.length === 0" class="flex flex-col items-center py-8 text-gray-400">
        <svg class="w-10 h-10 mb-2 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
        <p class="text-sm">Aún no hay categorías</p>
        <p class="text-xs mt-1">Usa el formulario de arriba para agregar la primera.</p>
      </div>
      <div v-else class="space-y-1">
        <div
          v-for="cat in menuStore.categorias"
          :key="cat.id"
          class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 group transition-colors"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-6 h-6 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">{{ cat.orden ?? '-' }}</span>
            <div class="min-w-0">
              <span class="text-sm font-medium text-gray-900">{{ cat.nombre }}</span>
              <span v-if="cat.descripcion" class="ml-2 text-xs text-gray-400">{{ cat.descripcion }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded hover:bg-primary-50 transition-colors" @click="editarCategoria(cat)">Editar</button>
            <AlertDialog>
              <AlertDialogTrigger>
                <button type="button" class="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">Eliminar</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar categoría</AlertDialogTitle>
                  <AlertDialogDescription>¿Eliminar la categoría "{{ cat.nombre }}"? Si tiene platos asociados, no se podrá eliminar.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction @click="eliminarCategoria(cat)" class="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <!-- Banner siguiente paso -->
      <div v-if="menuStore.categorias.length > 0" class="mt-5 flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-xl">
        <p class="text-xs text-primary-700">
          <span class="font-semibold">{{ menuStore.categorias.length }} categoría{{ menuStore.categorias.length !== 1 ? 's' : '' }}</span> registradas.
          ¡Ya puedes crear platos!
        </p>
        <button type="button" class="btn-primary text-xs" @click="activeTab = 'platos'">
          Siguiente: Platos &rarr;
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TAB 4: PLATOS                                                -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'platos'">
      <!-- Alertas de prerequisitos faltantes -->
      <div v-if="menuStore.categorias.length === 0" class="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p class="text-xs text-red-700">
          Necesitas al menos una categoría antes de crear platos.
          <button type="button" class="font-semibold underline ml-1" @click="activeTab = 'categorias'">Ir a Categorías</button>
        </p>
      </div>
      <div v-else-if="menuStore.ingredientes.length === 0" class="mb-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
        <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p class="text-[11px] text-amber-700">
          No hay ingredientes. Puedes crear platos, pero no podrás asociar ingredientes.
          <button type="button" class="font-semibold underline ml-0.5" @click="activeTab = 'ingredientes'">Crear ingredientes</button>
        </p>
      </div>

      <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <select v-model="filtroCategoria" class="input text-xs py-1.5 w-auto" @change="onFiltroChange">
            <option value="">Todas las categorías</option>
            <option v-for="cat in menuStore.categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
          </select>
          <span class="text-xs text-gray-400">
            {{ menuStore.platosPagination.total }} plato{{ menuStore.platosPagination.total !== 1 ? 's' : '' }}{{ filtroCategoria ? ' en esta categoría' : '' }}
          </span>
        </div>
        <button
          type="button"
          class="btn-primary text-xs"
          :disabled="menuStore.categorias.length === 0"
          @click="abrirFormPlato()"
        >+ Nuevo plato</button>
      </div>

      <!-- Lista platos -->
      <div v-if="menuStore.loadingPlatos" class="text-gray-500 text-sm py-6 text-center">Cargando platos...</div>
      <div v-else-if="menuStore.platos.length === 0" class="flex flex-col items-center py-8 text-gray-400">
        <svg class="w-10 h-10 mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <p class="text-sm">No hay platos{{ filtroCategoria ? ' en esta categoría' : '' }}</p>
        <button v-if="menuStore.categorias.length > 0" type="button" class="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium" @click="abrirFormPlato()">
          + Crear el primer plato
        </button>
      </div>
      <div v-else class="space-y-1.5">
        <div
          v-for="plato in menuStore.platos"
          :key="plato.id"
          class="flex items-center gap-3 py-2 px-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
        >
          <div class="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
            <img v-if="plato.imagen_url" :src="plato.imagen_url" :alt="plato.nombre" class="w-full h-full object-cover" />
            <svg v-else class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 truncate">{{ plato.nombre }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 shrink-0 border border-violet-100">{{ plato.categoria?.nombre || 'Sin categoría' }}</span>
            </div>
            <p v-if="plato.descripcion" class="text-xs text-gray-400 truncate mt-0.5">{{ plato.descripcion }}</p>
          </div>
          <span class="text-sm font-semibold text-gray-700 shrink-0">L {{ Number(plato.precio || 0).toFixed(2) }}</span>
          <button
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
            :class="plato.disponible ? 'bg-accent-500' : 'bg-gray-300'"
            :title="plato.disponible ? 'Disponible' : 'No disponible'"
            @click="toggleDisponibilidad(plato)"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200"
              :class="plato.disponible ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="text-xs text-primary-600 hover:text-primary-800 px-1" @click="abrirFormPlato(plato)">Editar</button>
            <AlertDialog>
              <AlertDialogTrigger>
                <button type="button" class="text-xs text-red-500 hover:text-red-700 px-1">Eliminar</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar plato</AlertDialogTitle>
                  <AlertDialogDescription>¿Eliminar el plato "{{ plato.nombre }}"? Se eliminarán también sus ingredientes asociados. Esta acción no se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction @click="eliminarPlato(plato)" class="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="menuStore.totalPaginasPlatos > 1" class="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-100">
        <button type="button" class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" :disabled="currentPage <= 1" @click="cambiarPagina(currentPage - 1)">
          &larr; Anterior
        </button>
        <span class="text-xs text-gray-500">{{ currentPage }} / {{ menuStore.totalPaginasPlatos }}</span>
        <button type="button" class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" :disabled="currentPage >= menuStore.totalPaginasPlatos" @click="cambiarPagina(currentPage + 1)">
          Siguiente &rarr;
        </button>
      </div>

      <!-- Modal plato -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showFormPlato" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cerrarFormPlato" />
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <!-- Header del modal -->
              <div class="sticky top-0 bg-white z-10 px-6 pt-5 pb-3 border-b border-gray-100">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900">{{ editingPlatoId ? 'Editar plato' : 'Nuevo plato' }}</h3>
                  <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="cerrarFormPlato">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div class="px-6 py-4 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                  <input v-model="formPlato.nombre" type="text" class="input text-sm" placeholder="Ej: Baleada especial" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea v-model="formPlato.descripcion" class="input text-sm" rows="2" placeholder="Describe el plato..." />
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
                      <option v-for="cat in menuStore.categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
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
                  <div v-if="loadingPlatoEdit" class="text-xs text-gray-400 py-2 text-center">Cargando ingredientes...</div>
                  <div v-else-if="formPlato.ingredientes.length > 0" class="space-y-1.5 mb-2">
                    <div
                      v-for="ing in formPlato.ingredientes"
                      :key="ing.ingrediente_id"
                      class="flex items-center gap-2 py-1.5 px-2.5 rounded-lg border"
                      :class="getIngrediente(ing.ingrediente_id)?.es_alergeno ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'"
                    >
                      <span class="text-xs font-medium flex-1 truncate" :class="getIngrediente(ing.ingrediente_id)?.es_alergeno ? 'text-orange-700' : 'text-gray-700'">
                        {{ getIngrediente(ing.ingrediente_id)?.nombre || 'Ingrediente' }}
                        <span v-if="getIngrediente(ing.ingrediente_id)?.es_alergeno" class="text-[9px] font-bold uppercase text-orange-500 ml-1">alérgeno</span>
                      </span>
                      <div class="flex items-center gap-1">
                        <input
                          v-model.number="ing.cantidad"
                          type="number"
                          min="1"
                          step="1"
                          class="input text-xs w-20 py-1 px-2"
                          :class="{ 'border-red-300 bg-red-50': !ing.cantidad || ing.cantidad <= 0 }"
                          placeholder="Cant."
                        />
                        <span class="text-[10px] text-gray-400">g</span>
                      </div>
                      <button type="button" class="text-gray-400 hover:text-red-500 text-sm leading-none" @click="quitarIngrediente(ing.ingrediente_id)">&times;</button>
                    </div>
                  </div>
                  <p v-else-if="!loadingPlatoEdit" class="text-xs text-gray-400 mb-2">Ninguno seleccionado</p>
                  <div class="flex items-center gap-2">
                    <select v-model.number="ingredienteSeleccionado" class="input text-xs py-1.5 flex-1">
                      <option :value="null" disabled>Agregar ingrediente...</option>
                      <option v-for="ing in ingredientesDisponibles" :key="ing.id" :value="ing.id">
                        {{ ing.nombre }}{{ ing.es_alergeno ? ' ⚠' : '' }}
                      </option>
                    </select>
                    <button type="button" class="btn-secondary text-xs shrink-0" :disabled="!ingredienteSeleccionado" @click="agregarIngrediente">Agregar</button>
                  </div>
                  <p
                    v-if="formPlato.ingredientes.length > 0 && formPlato.ingredientes.some(i => !i.cantidad || i.cantidad <= 0)"
                    class="text-[11px] text-red-500 mt-1.5"
                  >
                    Todos los ingredientes deben tener una cantidad en gramos mayor a 0.
                  </p>
                </div>

                <!-- Disponible -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="formPlato.disponible" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4" />
                  <span class="text-sm text-gray-700">Disponible en el menú</span>
                </label>
              </div>

              <!-- Footer del modal -->
              <div class="sticky bottom-0 bg-white z-10 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
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
              <p v-if="errorPlato" class="px-6 pb-3 text-xs text-red-500">{{ errorPlato }}</p>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { storageApi, menuApi } from '@/api'
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

const menuStore = useMenuStore()

// === Estado general ===
const activeTab = ref('alergias')
const successMsg = ref('')
let successTimer = null

function showSuccess(msg) {
  successMsg.value = msg
  clearTimeout(successTimer)
  successTimer = setTimeout(() => { successMsg.value = '' }, 2500)
}

// === Stepper index (cuántos pasos están "completos") ===
const stepIndex = computed(() => {
  let idx = 0
  if (menuStore.alergias.length > 0) idx = 1
  if (menuStore.ingredientes.length > 0) idx = 2
  if (menuStore.categorias.length > 0) idx = 3
  if (menuStore.platosPagination.total > 0) idx = 4
  return idx
})

// === Refs para autofocus ===
const alergiaInputRef = ref(null)
const ingredienteInputRef = ref(null)
const categoriaInputRef = ref(null)

// ===================== ALERGIAS =====================
const savingAlergia = ref(false)
const errorAlergia = ref('')
const editingAlergiaId = ref(null)
const formAlergia = ref({ nombre: '' })

function editarAlergia(al) {
  editingAlergiaId.value = al.id
  formAlergia.value = { nombre: al.nombre }
  nextTick(() => alergiaInputRef.value?.focus())
}

function cancelarAlergia() {
  editingAlergiaId.value = null
  formAlergia.value = { nombre: '' }
  errorAlergia.value = ''
}

async function guardarAlergia() {
  if (!formAlergia.value.nombre.trim()) return
  savingAlergia.value = true
  errorAlergia.value = ''
  try {
    if (editingAlergiaId.value) {
      await menuStore.updateAlergia(editingAlergiaId.value, formAlergia.value)
      showSuccess('Alergia actualizada')
      cancelarAlergia()
    } else {
      await menuStore.createAlergia({ nombre: formAlergia.value.nombre.trim() })
      showSuccess(`"${formAlergia.value.nombre.trim()}" agregada`)
      formAlergia.value = { nombre: '' }
      nextTick(() => alergiaInputRef.value?.focus())
    }
  } catch (err) {
    errorAlergia.value = err?.error || err?.message || 'Error al guardar alergia'
  } finally {
    savingAlergia.value = false
  }
}

async function eliminarAlergia(al) {
  try {
    await menuStore.deleteAlergia(al.id)
    showSuccess('Alergia eliminada')
  } catch (err) {
    errorAlergia.value = err?.error || err?.message || 'Error al eliminar alergia'
  }
}

// ===================== INGREDIENTES =====================
const savingIngrediente = ref(false)
const errorIngrediente = ref('')
const editingIngredienteId = ref(null)
const formIngrediente = ref({ nombre: '', alergia_ids: [] })

function editarIngrediente(ing) {
  editingIngredienteId.value = ing.id
  formIngrediente.value = {
    nombre: ing.nombre,
    alergia_ids: (ing.alergias || []).map(a => a.id),
  }
  nextTick(() => ingredienteInputRef.value?.focus())
}

function cancelarIngrediente() {
  editingIngredienteId.value = null
  formIngrediente.value = { nombre: '', alergia_ids: [] }
  errorIngrediente.value = ''
}

async function guardarIngrediente() {
  if (!formIngrediente.value.nombre.trim()) return
  savingIngrediente.value = true
  errorIngrediente.value = ''
  try {
    const payload = {
      nombre: formIngrediente.value.nombre.trim(),
      alergia_ids: formIngrediente.value.alergia_ids,
    }
    if (editingIngredienteId.value) {
      await menuStore.updateIngrediente(editingIngredienteId.value, payload)
      showSuccess('Ingrediente actualizado')
      cancelarIngrediente()
    } else {
      await menuStore.createIngrediente(payload)
      showSuccess(`"${payload.nombre}" agregado`)
      formIngrediente.value = { nombre: '', alergia_ids: [] }
      nextTick(() => ingredienteInputRef.value?.focus())
    }
  } catch (err) {
    errorIngrediente.value = err?.error || err?.message || 'Error al guardar ingrediente'
  } finally {
    savingIngrediente.value = false
  }
}

async function eliminarIngrediente(ing) {
  try {
    await menuStore.deleteIngrediente(ing.id)
    showSuccess('Ingrediente eliminado')
  } catch (err) {
    errorIngrediente.value = err?.error || err?.message || 'Error al eliminar ingrediente'
  }
}

// ===================== CATEGORÍAS =====================
const savingCategoria = ref(false)
const errorCategoria = ref('')
const editingCategoriaId = ref(null)
const formCategoria = ref({ nombre: '', descripcion: '', orden: 0 })

function editarCategoria(cat) {
  editingCategoriaId.value = cat.id
  formCategoria.value = { nombre: cat.nombre, descripcion: cat.descripcion || '', orden: cat.orden ?? 0 }
  nextTick(() => categoriaInputRef.value?.focus())
}

function cancelarCategoria() {
  editingCategoriaId.value = null
  formCategoria.value = { nombre: '', descripcion: '', orden: 0 }
  errorCategoria.value = ''
}

async function guardarCategoria() {
  if (!formCategoria.value.nombre.trim()) return
  savingCategoria.value = true
  errorCategoria.value = ''
  try {
    if (editingCategoriaId.value) {
      await menuStore.updateCategoria(editingCategoriaId.value, formCategoria.value)
      showSuccess('Categoría actualizada')
      cancelarCategoria()
    } else {
      await menuStore.createCategoria({
        nombre: formCategoria.value.nombre.trim(),
        descripcion: formCategoria.value.descripcion,
        orden: formCategoria.value.orden,
      })
      showSuccess(`"${formCategoria.value.nombre.trim()}" agregada`)
      formCategoria.value = { nombre: '', descripcion: '', orden: (formCategoria.value.orden || 0) + 1 }
      nextTick(() => categoriaInputRef.value?.focus())
    }
  } catch (err) {
    errorCategoria.value = err?.error || err?.message || 'Error al guardar categoría'
  } finally {
    savingCategoria.value = false
  }
}

async function eliminarCategoria(cat) {
  try {
    await menuStore.deleteCategoria(cat.id)
    showSuccess('Categoría eliminada')
  } catch (err) {
    errorCategoria.value = err?.error || err?.message || 'Error al eliminar categoría'
  }
}

// ===================== PLATOS =====================
const showFormPlato = ref(false)
const savingPlato = ref(false)
const errorPlato = ref('')
const editingPlatoId = ref(null)
const uploadingPlatoImg = ref(false)
const errorPlatoImg = ref('')
const platoImgPreview = ref(null)
const ingredienteSeleccionado = ref(null)
const filtroCategoria = ref('')
const currentPage = ref(1)
const pageSize = ref(15)

const formPlato = ref({
  nombre: '',
  descripcion: '',
  precio: null,
  categoria_id: null,
  imagen_url: '',
  disponible: true,
  ingredientes: [],
})

const formPlatoValido = computed(() => {
  const base = formPlato.value.nombre && formPlato.value.precio > 0 && formPlato.value.categoria_id
  if (!base) return false
  // Si tiene ingredientes, todos deben tener cantidad > 0
  if (formPlato.value.ingredientes.length > 0) {
    return formPlato.value.ingredientes.every(i => i.cantidad && i.cantidad > 0)
  }
  return true
})

const ingredientesDisponibles = computed(() => {
  const idsUsados = new Set(formPlato.value.ingredientes.map(i => i.ingrediente_id))
  return menuStore.ingredientes.filter(i => !idsUsados.has(i.id))
})

async function cargarPlatos() {
  const params = { page: currentPage.value, limit: pageSize.value }
  if (filtroCategoria.value) params.categoria_id = filtroCategoria.value
  await menuStore.fetchPlatos(params)
}

function onFiltroChange() {
  currentPage.value = 1
  cargarPlatos()
}

function cambiarPagina(newPage) {
  currentPage.value = newPage
  cargarPlatos()
}

const loadingPlatoEdit = ref(false)

async function abrirFormPlato(plato = null) {
  errorPlato.value = ''
  errorPlatoImg.value = ''
  platoImgPreview.value = null
  ingredienteSeleccionado.value = null

  if (plato) {
    editingPlatoId.value = plato.id
    // Cargar datos base inmediatamente
    formPlato.value = {
      nombre: plato.nombre,
      descripcion: plato.descripcion || '',
      precio: plato.precio,
      categoria_id: plato.categoria_id,
      imagen_url: plato.imagen_url || '',
      disponible: plato.disponible ?? true,
      ingredientes: [],
    }
    showFormPlato.value = true

    // Cargar ingredientes desde el backend (getPlatoById incluye ingredientes)
    loadingPlatoEdit.value = true
    try {
      const platoCompleto = await menuApi.getPlatoById(plato.id)
      if (platoCompleto?.ingredientes) {
        formPlato.value.ingredientes = platoCompleto.ingredientes.map(i => ({
          ingrediente_id: i.ingrediente?.id || i.ingrediente_id,
          cantidad: i.cantidad || '',
        }))
      }
    } catch (err) {
      console.warn('No se pudieron cargar los ingredientes del plato:', err)
    } finally {
      loadingPlatoEdit.value = false
    }
  } else {
    editingPlatoId.value = null
    formPlato.value = {
      nombre: '',
      descripcion: '',
      precio: null,
      categoria_id: menuStore.categorias[0]?.id || null,
      imagen_url: '',
      disponible: true,
      ingredientes: [],
    }
    showFormPlato.value = true
  }
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
  return menuStore.ingredientes.find(i => i.id === id)
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
      await menuStore.updatePlato(editingPlatoId.value, payload)
      showSuccess('Plato actualizado')
    } else {
      await menuStore.createPlato(payload)
      showSuccess(`"${payload.nombre}" creado`)
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
  try {
    await menuStore.toggleDisponibilidad(plato.id, !plato.disponible)
  } catch (err) {
    console.error('Error al cambiar disponibilidad:', err)
  }
}

async function eliminarPlato(plato) {
  try {
    await menuStore.deletePlato(plato.id)
    await cargarPlatos()
    showSuccess('Plato eliminado')
  } catch (err) {
    errorPlato.value = err?.error || err?.message || 'Error al eliminar plato'
  }
}

// ===================== TABS =====================
const tabs = computed(() => [
  { id: 'alergias', label: 'Alergias', short: 'Alerg.', count: menuStore.alergias.length },
  { id: 'ingredientes', label: 'Ingredientes', short: 'Ingred.', count: menuStore.ingredientes.length },
  { id: 'categorias', label: 'Categorías', short: 'Categ.', count: menuStore.categorias.length },
  { id: 'platos', label: 'Platos', short: 'Platos', count: menuStore.platosPagination.total },
])

// ===================== INIT =====================
onMounted(() => {
  menuStore.fetchAlergias()
  menuStore.fetchIngredientes()
  menuStore.fetchCategorias()
  cargarPlatos()
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
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
