import UnloggedView from './UnloggedView.vue'
import GuestLoginView from './GuestLoginView.vue';
import VAuth from './VAuth.vue';

/**
 * Thread-related routes
 * @type RouteRecordRaw[]
 */
const routes = [
  {
    path: '/',
    children: [
      {
        path: '/',
        name: 'UnloggedView',
        component: UnloggedView,
        meta: { authRedirectTo: 'Game' }
      },
      {
        path: 'guest',
        name: 'Guest',
        component: GuestLoginView,
        meta: { authRedirectTo: 'Game' }
      },
      {
        path: 'register',
        name: 'Register',
        component: VAuth,
        // component: () => import('./VAuth.vue'),
        props: { formType: 'register' },
        meta: { authRedirectTo: 'Game' }
      },
      {
        path: 'change-password',
        name: 'ChangePassword',
        component: VAuth,
        // component: () => import('./VAuth.vue'),
        props: { formType: 'change-password' },
        meta: { authRedirectTo: 'Game' }
      },
      {
        path: 'login',
        name: 'Login',
        component: VAuth,
        // component: () => import('./VAuth.vue'),
        props: { formType: 'login' },
        meta: { authRedirectTo: 'Game' }
      },
    ]
  }
];

export default routes;
