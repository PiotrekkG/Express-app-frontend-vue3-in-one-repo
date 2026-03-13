import ChatView from './ChatView.vue';

/**
 * Thread-related routes
 * @type RouteRecordRaw[]
 */
const routes = [
    {
        path: '/chat',
        name: 'Chat',
        component: ChatView,
        meta: { requiresAuth: true }
    },
];

export default routes;
