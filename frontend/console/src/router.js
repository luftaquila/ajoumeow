import { createRouter, createWebHistory } from 'vue-router'

import VerifyPage from './pages/VerifyPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import MembersPage from './pages/MembersPage.vue'
import Export1365Page from './pages/Export1365Page.vue'
import RecruitPage from './pages/RecruitPage.vue'

const routes = [
  { path: '/console', redirect: '/console/verify' },
  { path: '/console/verify', component: VerifyPage, meta: { requiresAdmin: true } },
  { path: '/console/settings', component: SettingsPage, meta: { requiresAdmin: true } },
  { path: '/console/members', component: MembersPage, meta: { requiresAdmin: true } },
  { path: '/console/1365', component: Export1365Page, meta: { requiresAdmin: true } },
  { path: '/console/recruit', component: RecruitPage, meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
