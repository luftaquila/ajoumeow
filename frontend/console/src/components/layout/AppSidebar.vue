<template>
  <nav class="flex flex-col h-full">
    <!-- Brand (desktop only, drawer has its own header) -->
    <a href="/timetable" class="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-surface-border no-underline">
      <img :src="'/res/image/logo-blue-square-without-desc.png'" class="w-8 h-8 rounded-lg" alt="logo">
      <div class="font-bold text-text leading-tight">미유미유<br><span class="text-xs text-text-muted font-normal">관리자 콘솔</span></div>
    </a>

    <div class="flex-1 overflow-y-auto py-2">
      <SidebarItem to="/console/home" icon="i-lucide-house" label="홈" @click="$emit('navigate')" />

      <p class="group-label">운영</p>
      <SidebarItem
        to="/console/verify" icon="i-lucide-calendar-check" label="급식 인증"
        :badge="unverifiedDates.length" :badge-title="`최근 ${UNVERIFIED_DAYS}일 중 인증하지 않은 날`"
        @click="$emit('navigate')"
      />
      <SidebarItem to="/console/1365" icon="i-lucide-hand-helping" label="1365 활동확인서" @click="$emit('navigate')" />

      <p class="group-label">회원</p>
      <SidebarItem to="/console/members" icon="i-lucide-users" label="회원 명단" @click="$emit('navigate')" />
      <SidebarItem
        to="/console/applications" icon="i-lucide-user-round-check" label="웹사이트 가입 승인"
        :badge="pendingApplications" badge-title="승인 대기"
        @click="$emit('navigate')"
      />
      <SidebarItem to="/console/recruit" icon="i-lucide-clipboard-list" label="신입 모집 설문" @click="$emit('navigate')" />

      <p class="group-label">관리</p>
      <SidebarItem to="/console/semester" icon="i-lucide-calendar-range" label="학기 전환" @click="$emit('navigate')" />
      <SidebarItem to="/console/settings" icon="i-lucide-settings" label="설정" @click="$emit('navigate')" />
    </div>

    <!-- User info + logout -->
    <div class="border-t border-surface-border px-5 py-3">
      <div class="flex items-center justify-between">
        <div class="text-sm">
          <span class="font-medium text-text">{{ user?.name }}</span>
          <span class="text-text-muted text-xs ml-1">({{ user?.role }})</span>
        </div>
        <button
          @click="logout"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-500 hover:bg-surface-dim transition-colors cursor-pointer"
          title="로그아웃"
        >
          <span class="i-lucide-log-out text-lg"></span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth.js'
import { useStatus, UNVERIFIED_DAYS } from '../../composables/useStatus.js'
import SidebarItem from './SidebarItem.vue'

defineEmits(['navigate'])

const { user, logout } = useAuth()
const { pendingApplications, unverifiedDates } = useStatus()
</script>

<style scoped>
.group-label {
  padding: 1rem 1.25rem 0.25rem;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text-muted);
}
</style>
