import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { title: 'Iniciar sesión', guest: true }
    },
    {
      path: '/registro',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { title: 'Crear cuenta', guest: true }
    },
    {
      path: '/verificar-correo',
      name: 'verificar-correo',
      component: () => import('@/views/auth/VerificarCorreoView.vue'),
      meta: { title: 'Verificar correo', requiresVerification: true }
    },
    {
      path: '/inicio',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Inicio', requiresAuth: true }
    },
    {
      path: '/reservas/nueva',
      name: 'reserva-nueva',
      component: () => import('@/views/reservas/ReservaNuevaView.vue'),
      meta: { title: 'Nueva reserva', requiresAuth: true }
    },
    {
      path: '/admin',
      component: () => import('@/layouts/ManagerLayout.vue'),
      meta: { requiresAuth: true, requiresManager: true },
      children: [
        {
          path: '',
          name: 'admin',
          component: () => import('@/views/manager/AdminDashboardView.vue'),
          meta: { title: 'Panel admin', requiresAuth: true, requiresManager: true }
        },
        {
          path: 'configuraciones',
          name: 'admin-configuraciones',
          component: () => import('@/views/manager/ConfiguracionesView.vue'),
          meta: { title: 'Configuraciones', requiresAuth: true, requiresManager: true }
        },
        {
          path: 'mesas',
          name: 'admin-mesas',
          component: () => import('@/views/manager/MesasView.vue'),
          meta: { title: 'Mesas', requiresAuth: true, requiresManager: true }
        },
        {
          path: 'panorama-mesas',
          name: 'admin-panorama-mesas',
          component: () => import('@/views/manager/PanoramaMesasView.vue'),
          meta: { title: 'Panorama de mesas', requiresAuth: true, requiresManager: true }
        },
        {
          path: 'menu',
          name: 'admin-menu',
          component: () => import('@/views/manager/MenuView.vue'),
          meta: { title: 'Menú', requiresAuth: true, requiresManager: true }
        },
        {
          path: 'revision-pagos',
          name: 'admin-revision-pagos',
          component: () => import('@/views/manager/RevisionPagosView.vue'),
          meta: { title: 'Revisión de pagos', requiresAuth: true, requiresManager: true }
        }
      ]
    },
    {
      path: '/configuraciones',
      redirect: '/admin/configuraciones'
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Página no encontrada' }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || 'ReservaYa'} - Sistema de Reservas`

  const authStore = useAuthStore()

  // Si hay token pero el usuario aún no está cargado (p. ej. tras F5), cargar primero
  // para no redirigir a verificar-correo por tener emailVerificado en false
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
    return
  }
  if (to.meta.requiresManager && !authStore.esManager) {
    next('/inicio')
    return
  }
  if (to.meta.guest && authStore.isAuthenticated) {
    if (authStore.emailVerificado) {
      next('/inicio')
    } else {
      next('/verificar-correo')
    }
    return
  }
  if (to.meta.requiresAuth && authStore.isAuthenticated && !authStore.emailVerificado && to.name !== 'verificar-correo') {
    next('/verificar-correo')
    return
  }
  if (to.meta.requiresVerification && !authStore.token) {
    next('/')
    return
  }
  if (to.meta.requiresVerification && authStore.emailVerificado) {
    next('/inicio')
    return
  }
  next()
})

// Si un componente lazy falla al cargar (chunk roto, red caída, deploy nuevo, etc.)
// redirigir a la página de error en lugar de mostrar pantalla en blanco
router.onError((error, to) => {
  if (
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed') ||
    error.message.includes('error loading dynamically imported module') ||
    error.message.includes('Unable to preload CSS')
  ) {
    router.push({
      name: 'not-found',
      query: { error: 'load', intended: to.fullPath }
    })
  }
})

export default router
