<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

interface MemberStat {
  name: string;
  studentId: string;
  count: number;
  score: number;
}

interface MonthlyCount {
  label: string;
  count: number;
}

const authStore = useAuthStore();
const loading = ref(true);
const yearlyStats = ref<MemberStat[]>([]);
const monthlyStats = ref<MemberStat[]>([]);
const monthlyCounts = ref<MonthlyCount[]>([]);
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);

const monthLabels = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

// Personal stats
const personalMonthly = computed(() => {
  if (!authStore.user) return null;
  return monthlyStats.value.find((s) => s.studentId === authStore.user!.studentId) ?? null;
});

const personalYearly = computed(() => {
  if (!authStore.user) return null;
  return yearlyStats.value.find((s) => s.studentId === authStore.user!.studentId) ?? null;
});

// Sorted stats for ranking table
const rankedStats = computed(() => {
  return [...yearlyStats.value].sort((a, b) => b.score - a.score || b.count - a.count);
});

// Max count for chart scaling
const maxMonthlyCount = computed(() => {
  return Math.max(...monthlyCounts.value.map((m) => m.count), 1);
});

async function fetchYearData() {
  loading.value = true;
  try {
    const year = selectedYear.value;

    // Build all promises: yearly stats + 12 monthly counts
    const promises: Promise<{ data: { data: MemberStat[] } }>[] = [
      api.get(`/records/statistics?type=yearly&from=${year}-01-01&to=${year}-12-31`),
    ];

    for (let i = 0; i < 12; i++) {
      const month = String(i + 1).padStart(2, '0');
      const lastDay = new Date(year, i + 1, 0).getDate();
      const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      promises.push(api.get(`/records/statistics?type=custom&from=${year}-${month}-01&to=${to}`));
    }

    const results = await Promise.all(promises);

    yearlyStats.value = results[0].data.data;

    monthlyCounts.value = monthLabels.map((label, i) => ({
      label,
      count: results[i + 1].data.data.reduce((sum, s) => sum + s.count, 0),
    }));
  } catch {
    yearlyStats.value = [];
    monthlyCounts.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchMonthlyStats() {
  try {
    const { data } = await api.get('/records/statistics?type=monthly');
    monthlyStats.value = data.data;
  } catch {
    monthlyStats.value = [];
  }
}

watch(selectedYear, fetchYearData);

onMounted(() => {
  Promise.all([fetchYearData(), fetchMonthlyStats()]);
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">활동 통계</h1>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
      />
    </div>

    <template v-else>
      <!-- Personal Stats Cards (logged-in only) -->
      <div v-if="authStore.isLoggedIn" class="grid gap-4 sm:grid-cols-2">
        <!-- Total Mileage -->
        <div class="rounded-xl bg-white p-6 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">총 마일리지 ({{ selectedYear }}년)</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ personalYearly?.score ?? 0
                }}<span class="text-base font-normal text-gray-500">점</span>
              </p>
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-400">{{ authStore.user?.name }}</p>
        </div>

        <!-- This Month Activity -->
        <div class="rounded-xl bg-white p-6 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">이번 달 활동</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ personalMonthly?.count ?? 0
                }}<span class="text-base font-normal text-gray-500">회</span>
              </p>
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-400">
            마일리지 {{ personalMonthly?.score ?? 0 }}점
          </p>
        </div>
      </div>

      <!-- Monthly Chart -->
      <section class="rounded-xl bg-white p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">월별 급식 현황</h2>
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              @click="selectedYear--"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="min-w-[4rem] text-center font-medium text-gray-700"
              >{{ selectedYear }}년</span
            >
            <button
              :disabled="selectedYear >= currentYear"
              class="rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              @click="selectedYear++"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Bar Chart -->
        <div class="flex items-end gap-1.5 sm:gap-2" style="height: 200px">
          <div
            v-for="m in monthlyCounts"
            :key="m.label"
            class="flex flex-1 flex-col items-center justify-end gap-1"
            style="height: 100%"
          >
            <span v-if="m.count > 0" class="text-xs font-medium text-gray-600">{{
              m.count
            }}</span>
            <div
              class="w-full rounded-t bg-primary-400 transition-all duration-300"
              :style="{
                height: m.count > 0 ? `${(m.count / maxMonthlyCount) * 80}%` : '0',
                minHeight: m.count > 0 ? '4px' : '0',
              }"
            />
            <span class="text-xs text-gray-500">{{ m.label }}</span>
          </div>
        </div>
      </section>

      <!-- Ranking Table -->
      <section class="rounded-xl bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">
          {{ selectedYear }}년 활동 순위
        </h2>

        <div
          v-if="rankedStats.length === 0"
          class="py-8 text-center text-sm text-gray-400"
        >
          활동 기록이 없습니다
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-xs text-gray-500">
                <th class="pb-2 pr-4 font-medium">순위</th>
                <th class="pb-2 pr-4 font-medium">이름</th>
                <th class="pb-2 pr-4 font-medium">학번</th>
                <th class="pb-2 pr-4 text-right font-medium">횟수</th>
                <th class="pb-2 text-right font-medium">마일리지</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(stat, index) in rankedStats"
                :key="stat.studentId"
                class="border-b border-gray-50 last:border-0"
                :class="{
                  'bg-primary-50 font-medium':
                    authStore.user && stat.studentId === authStore.user.studentId,
                }"
              >
                <td class="py-2.5 pr-4">
                  <span
                    v-if="index < 3"
                    class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    :class="[
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-gray-400'
                          : 'bg-amber-700',
                    ]"
                  >
                    {{ index + 1 }}
                  </span>
                  <span v-else class="pl-1.5 text-gray-500">{{ index + 1 }}</span>
                </td>
                <td class="py-2.5 pr-4 font-medium text-gray-800">{{ stat.name }}</td>
                <td class="py-2.5 pr-4 text-gray-500">{{ stat.studentId }}</td>
                <td class="py-2.5 pr-4 text-right text-gray-600">{{ stat.count }}회</td>
                <td class="py-2.5 text-right font-medium text-primary-600">
                  {{ stat.score }}점
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
