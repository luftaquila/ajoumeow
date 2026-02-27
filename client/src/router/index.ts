import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const requireAdmin: NavigationGuardWithThis<undefined> = () => {
  const auth = useAuthStore();
  if (!auth.isLoggedIn) {
    return { name: 'login' };
  }
  if (!auth.isAdmin) {
    return { name: 'home' };
  }
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
    },
    {
      path: '/timetable',
      name: 'timetable',
      component: () => import('@/pages/TimetablePage.vue'),
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('@/pages/GalleryPage.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/pages/StatsPage.vue'),
    },
    // Static pages
    {
      path: '/welcome',
      name: 'welcome',
      component: () => import('@/pages/WelcomePage.vue'),
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/pages/GuidePage.vue'),
    },
    {
      path: '/goods',
      name: 'goods',
      component: () => import('@/pages/GoodsPage.vue'),
    },
    {
      path: '/clubfair',
      name: 'clubfair',
      component: () => import('@/pages/ClubfairPage.vue'),
    },
    {
      path: '/fishbread',
      name: 'fishbread',
      component: () => import('@/pages/FishbreadPage.vue'),
    },
    // Admin console
    {
      path: '/admin',
      beforeEnter: requireAdmin,
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/pages/admin/DashboardPage.vue'),
        },
        {
          path: 'members',
          name: 'admin-members',
          component: () => import('@/pages/admin/MembersPage.vue'),
        },
        {
          path: 'registrations',
          name: 'admin-registrations',
          component: () => import('@/pages/admin/RegistrationsPage.vue'),
        },
        {
          path: 'verify',
          name: 'admin-verify',
          component: () => import('@/pages/admin/VerifyPage.vue'),
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('@/pages/admin/SettingsPage.vue'),
        },
        {
          path: 'logs',
          name: 'admin-logs',
          component: () => import('@/pages/admin/LogsPage.vue'),
        },
        {
          path: 'certificate',
          name: 'admin-certificate',
          component: () => import('@/pages/admin/CertificatePage.vue'),
        },
      ],
    },
  ],
});

export default router;
