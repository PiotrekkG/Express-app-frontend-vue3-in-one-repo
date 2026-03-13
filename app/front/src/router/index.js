import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import authRoutes from '@/routes/auth/routes';
import chatRoutes from '@/routes/chat/routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...chatRoutes,
    {
      path: '/:catchAll(.*)',
      name: 'NotFound',
      component: () => import('../NotFound.vue'),
    }
  ],
})

router.beforeEach(async (to, from) => {
  // Example: Check for authentication on certain routes
  // const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  const authStore = useAuthStore();
  const isAuthenticated = await authStore.isAuthenticated();

  if (to.meta.requiresAuth && !isAuthenticated) {
    return ({ name: 'UnloggedView' });
    // next({ name: 'UnloggedView' });
  } else if (to.meta.authRedirectTo && isAuthenticated) {
    return ({ name: to.meta.authRedirectTo });
    // next({ name: to.meta.authRedirectTo });
  } else {
    return true;
    // next();
  }
});

export default router
