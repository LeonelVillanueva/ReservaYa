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

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'MesaSegura'} - Sistema de Reservas`
  
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/inicio')
  } else {
    next()
  }
})

export default router
