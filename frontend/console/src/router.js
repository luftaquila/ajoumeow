import { createRouter, createWebHistory } from 'vue-router'

import HomePage from './pages/HomePage.vue'
import VerifyPage from './pages/VerifyPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import MembersPage from './pages/MembersPage.vue'
import Export1365Page from './pages/Export1365Page.vue'
import ApplicationsPage from './pages/ApplicationsPage.vue'
import RecruitPage from './pages/RecruitPage.vue'
import SemesterPage from './pages/SemesterPage.vue'

const routes = [
  { path: '/console', redirect: '/console/home' },
  { path: '/console/home', component: HomePage, meta: { requiresAdmin: true } },
  { path: '/console/verify', component: VerifyPage, meta: { requiresAdmin: true } },
  { path: '/console/applications', component: ApplicationsPage, meta: { requiresAdmin: true } },
  { path: '/console/members', component: MembersPage, meta: { requiresAdmin: true } },
  { path: '/console/recruit', component: RecruitPage, meta: { requiresAdmin: true } },
  { path: '/console/1365', component: Export1365Page, meta: { requiresAdmin: true } },
  { path: '/console/semester', component: SemesterPage, meta: { requiresAdmin: true } },
  { path: '/console/settings', component: SettingsPage, meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
