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
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || 'ReservaYa'} - Sistema de Reservas`

  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
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

export default router
