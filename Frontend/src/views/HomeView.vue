<template>
  <MainLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

      <!-- ===== BANNER PRINCIPAL ===== -->
      <section class="rounded-2xl bg-gradient-to-r from-primary-600 via-primary-650 to-primary-700 p-6 sm:p-8 text-white shadow-xl overflow-hidden relative">
        <!-- Decoración de fondo -->
        <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 blur-2xl"></div>
        <div class="absolute -left-6 -bottom-8 w-36 h-36 rounded-full bg-white/5 blur-xl"></div>

        <div class="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p class="text-primary-200 text-sm font-medium">{{ saludo }}, {{ authStore.userNombre || 'visitante' }}</p>
            <h1 class="text-xl sm:text-2xl font-bold mt-1">¿Listo para una experiencia única?</h1>
            <p class="text-primary-100 text-sm mt-1.5 max-w-md">
              {{ authStore.esManager ? 'Gestiona las reservas y mesas de tu restaurante desde aquí.' : 'Explora nuestro menú y reserva tu mesa en segundos.' }}
            </p>
          </div>
          <router-link
            to="/reservas/nueva"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary-700 font-semibold text-sm hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Reservar mesa
          </router-link>
        </div>
      </section>

      <!-- ===== CARRUSEL ===== -->
      <div v-if="appImagesStore.carruselImagenes.length > 0">
        <HomeCarousel
          :imagenes="appImagesStore.carruselImagenes"
          :intervalo="appImagesStore.carruselIntervalo"
        />
      </div>

      <!-- ===== STATS ===== -->
      <section class="grid grid-cols-2 gap-3" :class="authStore.esManager ? 'sm:grid-cols-4' : 'sm:grid-cols-3'">
        <div class="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <span class="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/20"></span>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900 leading-none">{{ resumenMesas.disponibles }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">Disponibles</p>
            </div>
          </div>
        </div>
        <div class="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <span class="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-400/20"></span>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900 leading-none">{{ resumenMesas.reservadas }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">Reservadas</p>
            </div>
          </div>
        </div>
        <div class="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <span class="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20"></span>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900 leading-none">{{ resumenMesas.ocupadas }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">Ocupadas</p>
            </div>
          </div>
        </div>
        <div v-if="authStore.esManager" class="group rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900 leading-none">{{ personasEsperadas }}</p>
              <p class="text-[11px] text-gray-400 mt-0.5">Personas esperadas</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== RESERVAS + MESAS ===== -->
      <section class="grid gap-6 lg:grid-cols-5 items-start">

        <!-- RESERVAS (3/5) -->
        <div class="lg:col-span-3 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">
                  {{ authStore.esManager ? 'Todas las reservas' : 'Mis reservas' }}
                </h2>
                <p class="text-[11px] text-gray-400">{{ reservasList.length }} activa{{ reservasList.length !== 1 ? 's' : '' }}</p>
              </div>
            </div>
            <router-link
              to="/reservas/nueva"
              class="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
            >+ Nueva</router-link>
          </div>

          <div class="px-5 py-4">
            <p v-if="errorAccion" class="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ errorAccion }}</p>

            <div v-if="reservasStore.loading" class="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg class="w-8 h-8 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm">Cargando reservas...</span>
            </div>

            <div v-else-if="!reservasList.length" class="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg class="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm">No hay reservas activas</p>
              <router-link to="/reservas/nueva" class="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium">Crear una reserva</router-link>
            </div>

            <div v-else class="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 -mr-1">
              <article
                v-for="r in reservasList"
                :key="r.id"
                class="group flex gap-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm p-3.5 transition-all"
              >
                <!-- Barra lateral de estado -->
                <div class="w-1 self-stretch rounded-full shrink-0" :class="estadoBarClase(r.estado?.nombre)"></div>

                <div class="flex-1 min-w-0">
                  <!-- Encabezado -->
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-semibold text-gray-900 truncate">{{ nombreReserva(r) }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                        <span>{{ formatoFecha(r.fecha) }}</span>
                        <span class="text-gray-300">·</span>
                        <span>{{ horaCorta(r.hora) }}</span>
                      </div>
                    </div>
                    <span
                      class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      :class="estadoClase(r.estado?.nombre)"
                    >{{ estadoEtiqueta(r.estado?.nombre) }}</span>
                  </div>

                  <!-- Detalles -->
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                    <span class="inline-flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {{ r.cantidad_personas }} {{ r.cantidad_personas === 1 ? 'persona' : 'personas' }}
                    </span>
                    <span v-if="r.mesa" class="inline-flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                      Mesa {{ r.mesa?.numero_mesa }}
                    </span>
                    <span v-if="r.reserva_por_llamada" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-medium">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Llamada
                    </span>
                    <template v-if="authStore.esManager">
                      <span v-if="emailReserva(r)" class="text-gray-400 truncate max-w-[160px]">{{ emailReserva(r) }}</span>
                      <span v-if="telefonoReserva(r)" class="text-gray-400">{{ telefonoReserva(r) }}</span>
                    </template>
                  </div>

                  <!-- Gracia -->
                  <div v-if="r.estado?.nombre === 'en_gracia'" class="mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Gracia: {{ graciaRestante(r) }}
                    <span v-if="graciaExpirada(r)" class="text-amber-800 font-bold">— Tiempo agotado</span>
                  </div>

                  <!-- Acciones -->
                  <div class="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-50">
                    <!-- Pendiente: confirmar o gracia -->
                    <template v-if="authStore.esManager && r.estado?.nombre === 'pendiente' && puedeAccionPendienteCercana(r)">
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                            Confirmar
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar llegada</AlertDialogTitle>
                            <AlertDialogDescription>¿Confirmar que el cliente llegó? Se ocuparán las mesas asignadas a esta reserva.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction @click="confirmarLlegada(r.id)">Sí, confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            15 min gracia
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Período de gracia</AlertDialogTitle>
                            <AlertDialogDescription>¿Iniciar período de gracia de 15 minutos? Al terminar el tiempo podrá marcar no show o confirmar llegada con retraso.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction @click="iniciarGracia(r.id)">Iniciar gracia</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </template>

                    <!-- Gracia expirada: no show o llegada con retraso -->
                    <template v-if="authStore.esManager && r.estado?.nombre === 'en_gracia' && graciaExpirada(r)">
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            No show
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>No show</AlertDialogTitle>
                            <AlertDialogDescription>El cliente no llegó. ¿Dar por perdida la reserva? Se liberarán las mesas.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction @click="expirarGracia(r.id)" class="bg-red-600 hover:bg-red-700 text-white">Sí, no show</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                            Llegó con retraso
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Llegada con retraso</AlertDialogTitle>
                            <AlertDialogDescription>¿El cliente llegó con retraso? Se confirmará la llegada y se ocuparán las mesas.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction @click="confirmarLlegada(r.id)">Sí, confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </template>

                    <!-- Cancelar -->
                    <AlertDialog v-if="puedeCancelar(r) && r.estado?.nombre !== 'en_gracia'">
                      <AlertDialogTrigger>
                        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Cancelar
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
                          <AlertDialogDescription>¿Cancelar esta reserva? Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No</AlertDialogCancel>
                          <AlertDialogAction @click="cancelar(r.id)" class="bg-red-600 hover:bg-red-700 text-white">Sí, cancelar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        <!-- MESAS (2/5) -->
        <div class="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-gray-900">Mesas</h2>
                <p v-if="authStore.esManager" class="text-[11px] text-gray-400">{{ mesasConEstado.length }} configuradas</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Toggle vista -->
              <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  class="p-1.5 rounded-md transition-colors"
                  :class="mesasVista === 'grid' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
                  title="Vista cuadrícula"
                  @click="mesasVista = 'grid'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-md transition-colors"
                  :class="mesasVista === 'lista' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
                  title="Vista lista"
                  @click="mesasVista = 'lista'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
              </div>
              <router-link
                v-if="authStore.esManager"
                :to="{ name: 'admin-panorama-mesas' }"
                class="text-xs font-semibold text-gray-500 hover:text-primary-600 transition-colors"
              >Ver todas &rarr;</router-link>
            </div>
          </div>

          <div class="px-4 py-4">
            <div v-if="loadingMesas" class="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg class="w-8 h-8 animate-spin mb-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm">Cargando mesas...</span>
            </div>
            <div v-else-if="!mesasConEstado.length" class="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg class="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p class="text-sm">No hay mesas configuradas</p>
            </div>
            <div
              v-else
              ref="mesasPanelRef"
              class="overflow-y-auto max-h-[520px] pr-1 -mr-1"
            >
              <!-- ====== VISTA GRID (default) ====== -->
              <div v-if="mesasVista === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                <div
                  v-for="m in mesasConEstado"
                  :key="m.id"
                  class="group rounded-xl overflow-hidden border-2 transition-all"
                  :class="[
                    mesaCardBorderClase(m.estado),
                    m.estado && m.estado !== 'disponible' ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                  ]"
                  @click="m.estado && m.estado !== 'disponible' ? abrirModalMesa(m) : null"
                >
                  <div class="relative aspect-square bg-gray-50/50 p-3 flex items-center justify-center">
                    <img
                      :src="appImagesStore.mesaUrl"
                      :alt="'Mesa ' + m.numero_mesa"
                      class="w-full h-full object-contain opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                    />
                    <div
                      class="absolute top-2 right-2 w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                      :class="estadoDotClase(m.estado)"
                    ></div>
                  </div>
                  <div class="px-3 py-2 bg-white">
                    <div class="flex items-center justify-between">
                      <p class="text-xs font-bold text-gray-900">Mesa {{ m.numero_mesa }}</p>
                      <span class="text-[10px] text-gray-400">{{ m.capacidad }} pers.</span>
                    </div>
                    <span
                      class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
                      :class="estadoMesaBadgeClase(m.estado)"
                    >{{ m.estado || 'disponible' }}</span>
                  </div>
                </div>
              </div>

              <!-- ====== VISTA LISTA / TABLA ====== -->
              <div v-else class="border border-gray-100 rounded-xl overflow-hidden">
                <!-- Encabezado tabla -->
                <div class="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <span class="w-8"></span>
                  <span>Mesa</span>
                  <span class="text-center">Capacidad</span>
                  <span class="text-right">Estado</span>
                </div>
                <!-- Filas -->
                <div class="divide-y divide-gray-50">
                  <div
                    v-for="m in mesasConEstado"
                    :key="m.id"
                    class="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-2.5 hover:bg-gray-50/80 transition-colors"
                    :class="m.estado && m.estado !== 'disponible' ? 'cursor-pointer' : 'cursor-default'"
                    @click="m.estado && m.estado !== 'disponible' ? abrirModalMesa(m) : null"
                  >
                    <!-- Imagen mini -->
                    <div class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <img :src="appImagesStore.mesaUrl" :alt="'Mesa ' + m.numero_mesa" class="w-6 h-6 object-contain opacity-70" />
                    </div>
                    <!-- Nombre -->
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-2 h-2 rounded-full shrink-0" :class="estadoDotClase(m.estado)"></div>
                      <p class="text-sm font-semibold text-gray-900 truncate">Mesa {{ m.numero_mesa }}</p>
                    </div>
                    <!-- Capacidad -->
                    <div class="flex items-center gap-1 text-xs text-gray-500 justify-center">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {{ m.capacidad }}
                    </div>
                    <!-- Estado -->
                    <span
                      class="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize text-right"
                      :class="estadoMesaBadgeClase(m.estado)"
                    >{{ m.estado || 'disponible' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== MENÚ ===== -->
      <section class="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <MenuDisplay />
      </section>

      <!-- ===== MODAL MESA ===== -->
      <Transition name="modal">
        <div
          v-if="mesaSeleccionada"
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          @click.self="cerrarModalMesa"
        >
          <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <img :src="appImagesStore.mesaUrl" alt="" class="w-7 h-7 object-contain" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-900">Mesa {{ mesaSeleccionada.numero_mesa }}</h2>
                  <p class="text-xs text-gray-500">Capacidad: {{ mesaSeleccionada.capacidad ?? 0 }} personas</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                  :class="estadoMesaBadgeClase(mesaSeleccionada.estado)"
                >{{ mesaSeleccionada.estado || 'disponible' }}</span>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  @click="cerrarModalMesa"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="px-6 py-5 max-h-[60vh] overflow-y-auto">
              <div v-if="reservasMesaSeleccionada.length" class="space-y-4">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reservas hoy</p>
                <div
                  v-for="r in reservasMesaSeleccionada"
                  :key="r.id"
                  class="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3"
                >
                  <!-- Resumen -->
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-1 rounded-lg bg-white text-xs font-medium text-gray-800 shadow-sm border border-gray-100">
                      {{ formatoFechaLargo(r.fecha) }}
                    </span>
                    <span class="px-2.5 py-1 rounded-lg bg-white text-xs font-medium text-gray-700 shadow-sm border border-gray-100">
                      {{ horaAmPm(r.hora) }}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] font-medium text-emerald-700">
                      {{ r.cantidad_personas }} {{ r.cantidad_personas === 1 ? 'persona' : 'personas' }}
                    </span>
                    <span class="ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold" :class="estadoClase(r.estado?.nombre)">
                      {{ estadoEtiqueta(r.estado?.nombre) }}
                    </span>
                  </div>

                  <!-- Cliente -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Cliente</p>
                      <p class="text-xs text-gray-800 flex items-center gap-2">
                        {{ nombreReserva(r) }}
                        <span v-if="r.reserva_por_llamada" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">Llamada</span>
                      </p>
                    </div>
                    <div v-if="emailReserva(r) || telefonoReserva(r)">
                      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Contacto</p>
                      <p class="text-xs text-gray-600">
                        <span v-if="emailReserva(r)">{{ emailReserva(r) }}</span>
                        <span v-if="emailReserva(r) && telefonoReserva(r)"> · </span>
                        <span v-if="telefonoReserva(r)">{{ telefonoReserva(r) }}</span>
                      </p>
                    </div>
                  </div>

                  <!-- Detalle -->
                  <div class="pt-3 border-t border-gray-100 space-y-1">
                    <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Detalle</p>
                    <p class="text-xs text-gray-600">Estado reserva: {{ estadoEtiqueta(r.estado?.nombre) }}</p>
                    <p v-if="r.duracion_estimada_minutos" class="text-xs text-gray-600">Duración estimada: {{ r.duracion_estimada_minutos }} min</p>
                  </div>

                  <!-- Notas -->
                  <div v-if="r.notas" class="pt-3 border-t border-gray-100">
                    <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Notas</p>
                    <p class="text-xs text-gray-600 leading-relaxed">{{ r.notas }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-col items-center py-8 text-gray-400">
                <svg class="w-10 h-10 mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm">Sin reservas activas para esta mesa hoy</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import MenuDisplay from '@/components/menu/MenuDisplay.vue'
import HomeCarousel from '@/components/carousel/HomeCarousel.vue'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { useMesasConEstado, invalidateMesasCache } from '@/composables/useMesasConEstado'
import { reservasApi } from '@/api'
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

const router = useRouter()
const authStore = useAuthStore()
const reservasStore = useReservasStore()
const appImagesStore = useAppImagesStore()

const { mesasConEstado, loadingMesas, cargarMesas } = useMesasConEstado()
const errorAccion = ref('')
const mesaSeleccionada = ref(null)
const mesasPanelRef = ref(null)
const mesasVista = ref('grid') // 'grid' | 'lista'

// === Saludo según hora del día ===
const saludo = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

// === Reservas filtradas: solo activas ===
const reservasList = computed(() => {
  const list = reservasStore.reservas || []
  const ocultar = ['cancelada', 'no_show']
  const debeOcultar = (r) => ocultar.includes((r.estado?.nombre || '').toLowerCase())
  return list.filter((r) => !debeOcultar(r)).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''))
})

// === Resumen de mesas ===
const resumenMesas = computed(() => {
  const list = mesasConEstado.value || []
  return {
    disponibles: list.filter(m => (m.estado || 'disponible').toLowerCase() === 'disponible').length,
    reservadas: list.filter(m => (m.estado || '').toLowerCase() === 'reservado').length,
    ocupadas: list.filter(m => (m.estado || '').toLowerCase() === 'ocupado').length,
  }
})

// === Personas esperadas hoy ===
const personasEsperadas = computed(() => {
  return reservasList.value.reduce((sum, r) => sum + (r.cantidad_personas || 0), 0)
})

// === Reservas de mesa seleccionada ===
const reservasMesaSeleccionada = computed(() => {
  if (!mesaSeleccionada.value) return []
  const mesaId = mesaSeleccionada.value.id
  const hoy = new Date().toISOString().slice(0, 10)
  return (reservasStore.reservas || []).filter(r => {
    if (!r.fecha || r.fecha !== hoy) return false
    if (!r.mesa?.id) return false
    return r.mesa.id === mesaId
  })
})

// === Helpers de mesas ===
function estadoMesaBadgeClase(estado) {
  const e = (estado || 'disponible').toLowerCase()
  if (e === 'ocupado') return 'bg-red-100 text-red-700'
  if (e === 'reservado') return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
}

function estadoDotClase(estado) {
  const e = (estado || 'disponible').toLowerCase()
  if (e === 'ocupado') return 'bg-red-500'
  if (e === 'reservado') return 'bg-orange-400'
  return 'bg-green-500'
}

function mesaCardBorderClase(estado) {
  const e = (estado || 'disponible').toLowerCase()
  if (e === 'ocupado') return 'border-red-200 bg-red-50/30'
  if (e === 'reservado') return 'border-orange-200 bg-orange-50/30'
  return 'border-gray-100 bg-white'
}

function abrirModalMesa(mesa) {
  mesaSeleccionada.value = mesa
}

function cerrarModalMesa() {
  mesaSeleccionada.value = null
}

// === Helpers de reservas ===
function estadoBarClase(nombre) {
  const n = (nombre || '').toLowerCase()
  if (n === 'confirmada') return 'bg-green-500'
  if (n === 'en_gracia') return 'bg-amber-400'
  if (n === 'completada') return 'bg-blue-500'
  if (n === 'cancelada' || n === 'no_show') return 'bg-gray-300'
  return 'bg-amber-400'
}

function formatoFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatoFechaLargo(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function horaCorta(hora) {
  if (!hora) return '—'
  const s = String(hora)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function horaAmPm(hora) {
  if (!hora) return '—'
  const [hStr, mStr] = String(hora).slice(0, 5).split(':')
  const hNum = Number(hStr)
  if (Number.isNaN(hNum)) return String(hora)
  const sufijo = hNum >= 12 ? 'PM' : 'AM'
  const h12 = ((hNum + 11) % 12) + 1
  return `${h12}:${mStr} ${sufijo}`
}

function nombreReserva(r) {
  if (r.reserva_por_llamada || r.nombre_cliente) return r.nombre_cliente || '—'
  if (r.usuario?.nombre || r.usuario?.apellido) {
    return [r.usuario.nombre, r.usuario.apellido].filter(Boolean).join(' ')
  }
  return '—'
}

function emailReserva(r) {
  if (r.reserva_por_llamada) return null
  return r.usuario?.email || null
}

function telefonoReserva(r) {
  if (r.reserva_por_llamada && r.telefono_cliente) return r.telefono_cliente
  return r.usuario?.telefono || null
}

function estadoClase(nombre) {
  const n = (nombre || '').toLowerCase()
  if (n === 'confirmada') return 'bg-green-100 text-green-800'
  if (n === 'cancelada' || n === 'no_show') return 'bg-gray-100 text-gray-600'
  if (n === 'completada') return 'bg-blue-100 text-blue-800'
  if (n === 'en_gracia') return 'bg-amber-100 text-amber-800'
  return 'bg-amber-100 text-amber-800'
}

function estadoEtiqueta(nombre) {
  if (!nombre) return '—'
  return String(nombre).replace('_', ' ')
}

function puedeCancelar(r) {
  const nombre = (r.estado?.nombre || '').toLowerCase()
  return nombre === 'pendiente' || nombre === 'confirmada'
}

function puedeAccionPendienteCercana(r) {
  if (!r || !r.fecha || !r.hora) return false
  const horaStr = String(r.hora).slice(0, 5)
  const fechaHora = new Date(`${r.fecha}T${horaStr}:00`)
  if (Number.isNaN(fechaHora.getTime())) return false
  const diffMin = (fechaHora.getTime() - ahora.value) / 60000
  return diffMin <= 60
}

// === Acciones de reserva ===
async function cancelar(id) {
  errorAccion.value = ''
  try {
    await reservasStore.cancelarReserva(id)
    await reservasStore.fetchReservas(paramsReservas())
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al cancelar'
  }
}

function paramsReservas() {
  if (authStore.esManager) return {}
  return { usuario_id: authStore.user?.id }
}

const ahora = ref(Date.now())

function graciaRestante(r) {
  if ((r.estado?.nombre || '') !== 'en_gracia' || !r.gracia_hasta) return null
  const fin = new Date(r.gracia_hasta).getTime()
  const rest = Math.max(0, Math.ceil((fin - ahora.value) / 1000))
  if (rest <= 0) return '0:00'
  const m = Math.floor(rest / 60)
  const s = rest % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function graciaExpirada(r) {
  if ((r.estado?.nombre || '') !== 'en_gracia' || !r.gracia_hasta) return false
  return new Date(r.gracia_hasta).getTime() <= ahora.value
}

async function confirmarLlegada(id) {
  errorAccion.value = ''
  try {
    await reservasApi.confirmar(id)
    await reservasStore.fetchReservas(paramsReservas())
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al confirmar'
  }
}

async function iniciarGracia(id) {
  errorAccion.value = ''
  try {
    await reservasApi.iniciarGracia(id)
    await reservasStore.fetchReservas(paramsReservas())
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al iniciar gracia'
  }
}

async function expirarGracia(id) {
  errorAccion.value = ''
  try {
    await reservasApi.expirarGracia(id)
    await reservasStore.fetchReservas(paramsReservas())
    invalidateMesasCache()
    await cargarMesas()
  } catch (err) {
    errorAccion.value = err?.error || err?.message || 'Error al marcar no show'
  }
}

// === Lifecycle ===
let intervalId = null
onMounted(async () => {
  await Promise.all([
    reservasStore.fetchReservas(paramsReservas()),
    cargarMesas(),
  ])
  intervalId = setInterval(() => {
    ahora.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

function cerrarSesion() {
  reservasStore.reservas = []
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
