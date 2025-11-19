import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // Route-based code splitting
      // Generates a separate chunk (HomeView.[hash].js) that is lazy-loaded
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/about',
      name: 'about',
      // Route-based code splitting
      // Generates a separate chunk (AboutView.[hash].js) that is lazy-loaded
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/cashier',
      name: 'cashier',
      // Route-based code splitting
      // Generates a separate chunk (CashierView.[hash].js) that is lazy-loaded
      component: () => import('../views/CashierView.vue')
    }
  ]
})

export default router
