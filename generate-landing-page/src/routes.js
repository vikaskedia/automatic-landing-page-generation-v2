import { createRouter, createWebHistory } from 'vue-router';
import DashboardCt from '@/components/DashboardCt.vue';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardCt
  }
];

const router = createRouter({
  history: createWebHistory('/landing-page-generation/'),
  routes
});

export default router;