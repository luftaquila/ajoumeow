<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';

interface Verification {
  id: number;
  memberId: number;
  date: string;
  course: string;
  score: number;
  verifiedAt: string;
  memberName: string;
  studentId: string;
}

interface UnverifiedRecord {
  id: number;
  memberId: number;
  date: string;
  course: string;
  createdAt: string;
  memberName: string;
  studentId: string;
}

const activeTab = ref<'pending' | 'history'>('pending');

// Pending tab state
const verificationsList = ref<Verification[]>([]);
const unverifiedList = ref<UnverifiedRecord[]>([]);
const pendingLoading = ref(true);
const selectedIds = ref<Set<number>>(new Set());
const bulkScore = ref(1);
const bulkVerifyLoading = ref(false);
const verifyLoadingIds = ref<Set<number>>(new Set());

// History tab state
const historyDate = ref(new Date().toISOString().slice(0, 10));
const historyVerifications = ref<Verification[]>([]);
const historyLoading = ref(false);

// Delete state
const deleteConfirmOpen = ref(false);
const deleteTarget = ref<Verification | null>(null);
const deleteLoading = ref(false);

// Messages
const errorMessage = ref('');
const successMessage = ref('');

const allSelected = computed({
  get: () =>
    unverifiedList.value.length > 0 &&
    selectedIds.value.size === unverifiedList.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedIds.value = new Set(unverifiedList.value.map((r) => r.id));
    } else {
      selectedIds.value = new Set();
    }
  },
});

const hasSelection = computed(() => selectedIds.value.size > 0);

function toggleSelection(id: number) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedIds.value = next;
}

function showSuccess(msg: string) {
  successMessage.value = msg;
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
}

async function fetchPendingData() {
  pendingLoading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/verify');
    verificationsList.value = data.verifications;
    unverifiedList.value = data.unverified;
  } catch {
    verificationsList.value = [];
    unverifiedList.value = [];
  } finally {
    pendingLoading.value = false;
  }
}

async function verifyRecord(record: UnverifiedRecord, score: number) {
  verifyLoadingIds.value.add(record.id);
  errorMessage.value = '';

  try {
    await api.post('/verify', {
      memberId: record.memberId,
      date: record.date,
      course: record.course,
      score,
    });
    selectedIds.value.delete(record.id);
    showSuccess(`${record.memberName}님의 ${record.course} 인증이 완료되었습니다.`);
    await fetchPendingData();
  } catch {
    errorMessage.value = `${record.memberName}님 인증에 실패했습니다.`;
  } finally {
    verifyLoadingIds.value.delete(record.id);
  }
}

async function bulkVerify() {
  if (!hasSelection.value) return;
  bulkVerifyLoading.value = true;
  errorMessage.value = '';

  const targets = unverifiedList.value.filter((r) => selectedIds.value.has(r.id));
  let successCount = 0;
  let failCount = 0;

  for (const record of targets) {
    try {
      await api.post('/verify', {
        memberId: record.memberId,
        date: record.date,
        course: record.course,
        score: bulkScore.value,
      });
      successCount++;
    } catch {
      failCount++;
    }
  }

  selectedIds.value = new Set();
  if (failCount > 0) {
    errorMessage.value = `${successCount}건 인증 완료, ${failCount}건 실패`;
  } else {
    showSuccess(`${successCount}건이 일괄 인증되었습니다.`);
  }
  await fetchPendingData();
  bulkVerifyLoading.value = false;
}

async function fetchHistory() {
  historyLoading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/verify', {
      params: { date: historyDate.value },
    });
    historyVerifications.value = data.verifications;
  } catch {
    historyVerifications.value = [];
  } finally {
    historyLoading.value = false;
  }
}

function openDeleteConfirm(verification: Verification) {
  deleteTarget.value = verification;
  deleteConfirmOpen.value = true;
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false;
  deleteTarget.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;
  errorMessage.value = '';

  try {
    await api.delete(`/verify/${deleteTarget.value.id}`);
    showSuccess('인증 기록이 삭제되었습니다.');
    closeDeleteConfirm();
    // Refresh the active tab's data
    if (activeTab.value === 'pending') {
      await fetchPendingData();
    } else {
      await fetchHistory();
    }
  } catch {
    errorMessage.value = '인증 기록 삭제에 실패했습니다.';
    closeDeleteConfirm();
  } finally {
    deleteLoading.value = false;
  }
}

function switchTab(tab: 'pending' | 'history') {
  activeTab.value = tab;
  errorMessage.value = '';
  successMessage.value = '';
  if (tab === 'history' && historyVerifications.value.length === 0) {
    fetchHistory();
  }
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  fetchPendingData();
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">급식 인증 관리</h1>

    <!-- Tabs -->
    <div class="flex gap-1 rounded-lg bg-gray-100 p-1">
      <button
        class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        :class="
          activeTab === 'pending'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="switchTab('pending')"
      >
        인증 대기
        <span
          v-if="unverifiedList.length > 0"
          class="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs text-white"
        >
          {{ unverifiedList.length }}
        </span>
      </button>
      <button
        class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        :class="
          activeTab === 'history'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="switchTab('history')"
      >
        인증 기록
      </button>
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="rounded-lg bg-green-50 p-3 text-sm text-green-700"
    >
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="rounded-lg bg-red-50 p-3 text-sm text-red-600"
    >
      {{ errorMessage }}
    </div>

    <!-- Pending Tab -->
    <template v-if="activeTab === 'pending'">
      <!-- Bulk actions -->
      <div
        v-if="hasSelection"
        class="flex flex-wrap items-center gap-3 rounded-lg bg-primary-50 p-3"
      >
        <span class="text-sm font-medium text-primary-700">{{ selectedIds.size }}건 선택</span>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">점수:</label>
          <input
            v-model.number="bulkScore"
            type="number"
            min="0"
            step="0.5"
            class="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          :disabled="bulkVerifyLoading"
          class="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          @click="bulkVerify"
        >
          {{ bulkVerifyLoading ? '처리 중...' : '일괄 인증' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="pendingLoading" class="flex items-center justify-center py-12">
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
      </div>

      <template v-else>
        <!-- Unverified Records -->
        <div v-if="unverifiedList.length > 0">
          <h2 class="mb-3 text-lg font-semibold text-gray-700">미인증 급식 신청</h2>
          <div class="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50 text-left text-xs text-gray-500">
                  <th class="px-4 py-3">
                    <input
                      type="checkbox"
                      :checked="allSelected"
                      class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      @change="allSelected = ($event.target as HTMLInputElement).checked"
                    />
                  </th>
                  <th class="px-4 py-3 font-medium">이름</th>
                  <th class="px-4 py-3 font-medium">학번</th>
                  <th class="px-4 py-3 font-medium">코스</th>
                  <th class="hidden px-4 py-3 font-medium sm:table-cell">신청일시</th>
                  <th class="px-4 py-3 font-medium">인증</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in unverifiedList"
                  :key="record.id"
                  class="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td class="px-4 py-3">
                    <input
                      type="checkbox"
                      :checked="selectedIds.has(record.id)"
                      class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      @change="toggleSelection(record.id)"
                    />
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ record.memberName }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ record.studentId }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ record.course }}</td>
                  <td class="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {{ formatDateTime(record.createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      :disabled="verifyLoadingIds.has(record.id)"
                      class="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                      @click="verifyRecord(record, 1)"
                    >
                      {{ verifyLoadingIds.has(record.id) ? '...' : '인증' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="border-t px-4 py-3 text-sm text-gray-500">
              총 {{ unverifiedList.length }}건의 미인증 신청
            </div>
          </div>
        </div>

        <!-- No unverified records -->
        <div
          v-else
          class="rounded-xl bg-white p-8 text-center shadow-sm"
        >
          <p class="text-gray-400">오늘 미인증 급식 신청이 없습니다</p>
        </div>

        <!-- Today's Verified Records -->
        <div v-if="verificationsList.length > 0">
          <h2 class="mb-3 text-lg font-semibold text-gray-700">오늘 인증 완료</h2>
          <div class="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50 text-left text-xs text-gray-500">
                  <th class="px-4 py-3 font-medium">이름</th>
                  <th class="px-4 py-3 font-medium">학번</th>
                  <th class="px-4 py-3 font-medium">코스</th>
                  <th class="px-4 py-3 font-medium">점수</th>
                  <th class="hidden px-4 py-3 font-medium sm:table-cell">인증일시</th>
                  <th class="px-4 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="v in verificationsList"
                  :key="v.id"
                  class="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td class="px-4 py-3 font-medium text-gray-800">{{ v.memberName }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ v.studentId }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ v.course }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ v.score }}</td>
                  <td class="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {{ formatDateTime(v.verifiedAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      @click="openDeleteConfirm(v)"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="border-t px-4 py-3 text-sm text-gray-500">
              총 {{ verificationsList.length }}건 인증 완료
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- History Tab -->
    <template v-if="activeTab === 'history'">
      <!-- Date filter -->
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">날짜 선택:</label>
        <input
          v-model="historyDate"
          type="date"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          :disabled="historyLoading"
          class="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          @click="fetchHistory"
        >
          {{ historyLoading ? '조회 중...' : '조회' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="historyLoading" class="flex items-center justify-center py-12">
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
      </div>

      <!-- History Table -->
      <div
        v-else-if="historyVerifications.length > 0"
        class="overflow-x-auto rounded-xl bg-white shadow-sm"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-left text-xs text-gray-500">
              <th class="px-4 py-3 font-medium">이름</th>
              <th class="px-4 py-3 font-medium">학번</th>
              <th class="px-4 py-3 font-medium">코스</th>
              <th class="px-4 py-3 font-medium">점수</th>
              <th class="hidden px-4 py-3 font-medium sm:table-cell">인증일시</th>
              <th class="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="v in historyVerifications"
              :key="v.id"
              class="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-medium text-gray-800">{{ v.memberName }}</td>
              <td class="px-4 py-3 text-gray-600">{{ v.studentId }}</td>
              <td class="px-4 py-3 text-gray-600">{{ v.course }}</td>
              <td class="px-4 py-3 text-gray-600">{{ v.score }}</td>
              <td class="hidden px-4 py-3 text-gray-600 sm:table-cell">
                {{ formatDateTime(v.verifiedAt) }}
              </td>
              <td class="px-4 py-3">
                <button
                  class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  @click="openDeleteConfirm(v)"
                >
                  삭제
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="border-t px-4 py-3 text-sm text-gray-500">
          {{ historyDate }} - 총 {{ historyVerifications.length }}건
        </div>
      </div>

      <!-- Empty History -->
      <div v-else class="rounded-xl bg-white p-8 text-center shadow-sm">
        <p class="text-gray-400">해당 날짜의 인증 기록이 없습니다</p>
      </div>
    </template>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeDeleteConfirm"
      >
        <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h2 class="mb-2 text-lg font-semibold text-gray-800">인증 기록 삭제</h2>
          <p class="mb-6 text-sm text-gray-600">
            <span class="font-medium">{{ deleteTarget?.memberName }}</span>
            ({{ deleteTarget?.studentId }})님의
            <span class="font-medium">{{ deleteTarget?.course }}</span>
            인증 기록을 삭제하시겠습니까?
          </p>

          <div class="flex gap-3">
            <button
              class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="closeDeleteConfirm"
            >
              취소
            </button>
            <button
              :disabled="deleteLoading"
              class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              @click="confirmDelete"
            >
              {{ deleteLoading ? '처리 중...' : '삭제' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
