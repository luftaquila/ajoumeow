import { createRouter, createWebHistory } from 'vue-router'

import HomePage from './pages/HomePage.vue'
import VerifyPage from './pages/VerifyPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import MembersPage from './pages/MembersPage.vue'
import Export1365Page from './pages/Export1365Page.vue'
import ApplicationsPage from './pages/ApplicationsPage.vue'
import RecruitPage from './pages/RecruitPage.vue'

const routes = [
  { path: '/console', redirect: '/console/home' },
  { path: '/console/home', component: HomePage, meta: { title: '홈' } },
  { path: '/console/verify', component: VerifyPage, meta: { title: '급식 인증' } },
  { path: '/console/applications', component: ApplicationsPage, meta: { title: '가입 승인' } },
  { path: '/console/members', component: MembersPage, meta: { title: '회원 명단' } },
  { path: '/console/recruit', component: RecruitPage, meta: { title: '신입 모집 설문' } },
  { path: '/console/1365', component: Export1365Page, meta: { title: '1365 활동확인서' } },
  { path: '/console/settings', component: SettingsPage, meta: { title: '설정' } },
  { path: '/console/:pathMatch(.*)*', redirect: '/console/home' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} · 미유미유 콘솔` : '미유미유 콘솔'
})

export default router
