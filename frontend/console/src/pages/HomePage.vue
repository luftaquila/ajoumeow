<template>
  <div class="max-w-5xl">
    <PageHeader title="홈" icon="i-lucide-house" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Pending applications -->
      <router-link to="/console/applications" class="home-card">
        <div class="home-card-label"><span class="i-lucide-user-round-check"></span>가입 신청 대기</div>
        <div class="home-card-value" :class="{ 'text-red-500': pending.length }">{{ pending.length }}<span class="unit">건</span></div>
        <p class="home-card-sub">
          <template v-if="pending.length">가장 오래된 신청 {{ ago(oldestPending) }}</template>
          <template v-else>대기 중인 신청이 없습니다</template>
        </p>
      </router-link>

      <!-- Verification -->
      <router-link to="/console/verify" class="home-card">
        <div class="home-card-label"><span class="i-lucide-calendar-check"></span>미인증 급식일</div>
        <div class="home-card-value" :class="{ 'text-red-500': unverifiedDates.length }">{{ unverifiedDates.length }}<span class="unit">일</span></div>
        <p class="home-card-sub">
          최근 {{ UNVERIFIED_DAYS }}일 · 마지막 인증 {{ latestDate ? `${latestDate} (${ago(latestDate)})` : '없음' }}
        </p>
      </router-link>

      <!-- Members -->
      <router-link to="/console/members" class="home-card">
        <div class="home-card-label"><span class="i-lucide-users"></span>{{ semester }} 회원</div>
        <div class="home-card-value">{{ memberCount }}<span class="unit">명</span></div>
        <p class="home-card-sub">임원 {{ officerCount }}명 포함</p>
      </router-link>

      <!-- Intake windows -->
      <router-link to="/console/settings" class="home-card" title="설정에서 바꾸기">
        <div class="home-card-label"><span class="i-lucide-calendar-clock"></span>신청 기간</div>
        <div class="flex flex-col gap-2 mt-1">
          <div v-for="w in windows" :key="w.label" class="flex items-center justify-between gap-3 text-sm">
            <span class="font-medium">{{ w.label }}</span>
            <span class="text-right">
              <span :class="w.state.open ? 'text-green-600' : 'text-text-muted'" class="font-medium">{{ w.state.open ? '받는 중' : '닫힘' }}</span>
              <span class="block text-xs text-text-muted">{{ windowText(w.state) }}</span>
            </span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { getApplications } from '../api/applications.js'
import { getLatestVerification } from '../api/verifications.js'
import { getMembers } from '../api/members.js'
import { useStatus, UNVERIFIED_DAYS } from '../composables/useStatus.js'

const { semester, apply, register, unverifiedDates, refreshStatus } = useStatus()

const pending = ref([])
const latestDate = ref('')
const members = ref([])

const oldestPending = computed(() => pending.value.map(a => a.createdAt).sort()[0])
const memberCount = computed(() => members.value.length)
const officerCount = computed(() => members.value.filter(m => m.role !== '회원').length)
const windows = computed(() => [
  { label: '회원 등록', state: apply.value },
  { label: '신입 모집', state: register.value },
])

function ago(dateStr) {
  if (!dateStr) return ''
  const then = new Date(dateStr.slice(0, 10) + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((today - then) / 86400000)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  return `${days}일 전`
}

function windowText(state) {
  if (!state.enabled) return '꺼짐'
  if (!state.restricted) return '기간 제한 없음'
  return state.term.replace('~', ' ~ ')
}

onMounted(async () => {
  await refreshStatus()
  const [apps, latest, list] = await Promise.allSettled([
    getApplications(undefined, 'pending'),
    getLatestVerification(),
    semester.value ? getMembers(semester.value) : Promise.reject(),
  ])
  if (apps.status === 'fulfilled') pending.value = apps.value.data
  if (latest.status === 'fulfilled' && latest.value.data) latestDate.value = latest.value.data.date
  if (list.status === 'fulfilled') members.value = list.value.data
})
</script>

<style scoped>
.home-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--c-surface);
  border: 1px solid color-mix(in srgb, var(--c-surface-border) 70%, transparent);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s;
}
.home-card:hover {
  box-shadow: var(--shadow-card-hover);
}
.home-card-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--c-text-secondary);
}
.home-card-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}
.home-card-value .unit {
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.25rem;
  color: var(--c-text-muted);
}
.home-card-sub {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}
</style>
