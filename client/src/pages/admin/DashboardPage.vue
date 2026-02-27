<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';

interface DashboardStats {
  semester: string | null;
  memberCount: number;
  monthlyRecordCount: number;
  photoCount: number;
  recentRecords: Array<{
    id: number;
    memberId: number;
    date: string;
    course: string;
    createdAt: string;
    memberName: string;
  }>;
}

interface MemberStat {
  memberId: number;
  name: string;
  studentId: string;
  score: number;
  count: number;
}

interface LotteryResult {
  winner: MemberStat | null;
  members: MemberStat[];
}

const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

const lotteryResult = ref<LotteryResult | null>(null);
const lotteryLoading = ref(false);
const lotteryAnimating = ref(false);

const courseColors: Record<string, string> = {
  '1코스': 'bg-blue-100 text-blue-800',
  '2코스': 'bg-green-100 text-green-800',
  '3코스': 'bg-purple-100 text-purple-800',
};

async function fetchDashboard() {
  try {
    const { data } = await api.get('/admin/dashboard');
    stats.value = data;
  } catch {
    stats.value = null;
  } finally {
    loading.value = false;
  }
}

async function runLottery() {
  lotteryLoading.value = true;
  lotteryAnimating.value = true;
  lotteryResult.value = null;

  try {
    const { data } = await api.post('/admin/lottery');

    // Animate before showing result
    await new Promise((resolve) => setTimeout(resolve, 1500));
    lotteryResult.value = data;
  } catch {
    lotteryResult.value = null;
  } finally {
    lotteryLoading.value = false;
    lotteryAnimating.value = false;
  }
}

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">관리자 대시보드</h1>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
      />
    </div>

    <template v-else-if="stats">
      <!-- Stat Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Member Count -->
        <div class="rounded-xl bg-white p-6 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">현재 학기 회원</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.memberCount }}<span class="text-base font-normal text-gray-500">명</span>
              </p>
            </div>
          </div>
          <p v-if="stats.semester" class="mt-2 text-xs text-gray-400">
            {{ stats.semester }}
          </p>
        </div>

        <!-- Monthly Record Count -->
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
              <p class="text-sm text-gray-500">이번 달 급식</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.monthlyRecordCount }}<span class="text-base font-normal text-gray-500">회</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Photo Count -->
        <div class="rounded-xl bg-white p-6 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm text-gray-500">갤러리 사진</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.photoCount }}<span class="text-base font-normal text-gray-500">장</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Recent Records -->
        <section class="rounded-xl bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-800">최근 급식 기록</h2>
          <div
            v-if="stats.recentRecords.length === 0"
            class="py-8 text-center text-sm text-gray-400"
          >
            급식 기록이 없습니다
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-xs text-gray-500">
                  <th class="pb-2 pr-4 font-medium">날짜</th>
                  <th class="pb-2 pr-4 font-medium">이름</th>
                  <th class="pb-2 font-medium">코스</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in stats.recentRecords"
                  :key="record.id"
                  class="border-b border-gray-50 last:border-0"
                >
                  <td class="py-2.5 pr-4 text-gray-600">{{ record.date }}</td>
                  <td class="py-2.5 pr-4 font-medium text-gray-800">
                    {{ record.memberName }}
                  </td>
                  <td class="py-2.5">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="courseColors[record.course] ?? 'bg-gray-100 text-gray-800'"
                    >
                      {{ record.course }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Lottery Section -->
        <section class="rounded-xl bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-semibold text-gray-800">마일리지 보상 추첨</h2>
          <p class="mb-4 text-sm text-gray-500">
            이번 달 마일리지를 기반으로 가중치 랜덤 추첨합니다. 마일리지가 높을수록 당첨 확률이
            올라갑니다.
          </p>

          <button
            :disabled="lotteryLoading"
            class="w-full rounded-lg bg-primary-500 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            @click="runLottery"
          >
            <span v-if="lotteryLoading" class="inline-flex items-center gap-2">
              <svg
                class="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              추첨 중...
            </span>
            <span v-else>추첨하기</span>
          </button>

          <!-- Lottery Result -->
          <div v-if="lotteryResult" class="mt-4">
            <div
              v-if="lotteryResult.winner"
              class="rounded-lg border-2 border-primary-200 bg-primary-50 p-4 text-center"
            >
              <p class="text-sm text-primary-600">당첨자</p>
              <p class="mt-1 text-xl font-bold text-primary-700">
                {{ lotteryResult.winner.name }}
              </p>
              <p class="text-sm text-gray-500">
                {{ lotteryResult.winner.studentId }} / 마일리지:
                {{ lotteryResult.winner.score }}점 ({{ lotteryResult.winner.count }}회)
              </p>
            </div>
            <div
              v-else
              class="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500"
            >
              이번 달 마일리지가 있는 회원이 없습니다
            </div>

            <!-- Member mileage list -->
            <div
              v-if="lotteryResult.members.length > 0"
              class="mt-4"
            >
              <h3 class="mb-2 text-sm font-medium text-gray-600">
                이번 달 회원별 마일리지
              </h3>
              <div class="max-h-60 overflow-y-auto rounded-lg border">
                <table class="w-full text-sm">
                  <thead class="sticky top-0 bg-gray-50">
                    <tr class="text-left text-xs text-gray-500">
                      <th class="px-3 py-2 font-medium">이름</th>
                      <th class="px-3 py-2 font-medium">학번</th>
                      <th class="px-3 py-2 text-right font-medium">횟수</th>
                      <th class="px-3 py-2 text-right font-medium">마일리지</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="member in lotteryResult.members"
                      :key="member.memberId"
                      class="border-t border-gray-100"
                      :class="{
                        'bg-primary-50 font-medium':
                          lotteryResult.winner &&
                          member.memberId === lotteryResult.winner.memberId,
                      }"
                    >
                      <td class="px-3 py-2">{{ member.name }}</td>
                      <td class="px-3 py-2 text-gray-500">{{ member.studentId }}</td>
                      <td class="px-3 py-2 text-right">{{ member.count }}</td>
                      <td class="px-3 py-2 text-right">{{ member.score }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="py-12 text-center text-gray-400">
      대시보드 데이터를 불러올 수 없습니다
    </div>
  </div>
</template>
