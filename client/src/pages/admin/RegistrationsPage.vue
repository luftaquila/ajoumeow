<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';

interface Registration {
  id: number;
  studentId: string;
  name: string;
  college: string;
  department: string;
  phone: string;
  semesterId: number;
  createdAt: string;
}

const registrations = ref<Registration[]>([]);
const loading = ref(true);
const selectedIds = ref<Set<number>>(new Set());

const approveLoading = ref<Set<number>>(new Set());
const rejectLoading = ref<Set<number>>(new Set());
const bulkApproveLoading = ref(false);
const bulkRejectLoading = ref(false);

const errorMessage = ref('');
const successMessage = ref('');

const allSelected = computed({
  get: () =>
    registrations.value.length > 0 &&
    selectedIds.value.size === registrations.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedIds.value = new Set(registrations.value.map((r) => r.id));
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

async function fetchRegistrations() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/users/register');
    registrations.value = data;
  } catch {
    registrations.value = [];
  } finally {
    loading.value = false;
  }
}

function showSuccess(msg: string) {
  successMessage.value = msg;
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
}

async function approveRegistration(reg: Registration) {
  approveLoading.value.add(reg.id);
  errorMessage.value = '';

  try {
    await api.post('/users', {
      student_id: reg.studentId,
      name: reg.name,
      college: reg.college,
      department: reg.department,
      phone: reg.phone,
    });
    // Delete the registration after approval
    await api.delete(`/users/register/${reg.id}`);
    selectedIds.value.delete(reg.id);
    showSuccess(`${reg.name}님이 회원으로 승인되었습니다.`);
    await fetchRegistrations();
  } catch {
    errorMessage.value = `${reg.name}님 승인에 실패했습니다.`;
  } finally {
    approveLoading.value.delete(reg.id);
  }
}

async function rejectRegistration(reg: Registration) {
  rejectLoading.value.add(reg.id);
  errorMessage.value = '';

  try {
    await api.delete(`/users/register/${reg.id}`);
    selectedIds.value.delete(reg.id);
    showSuccess(`${reg.name}님의 신청이 거절되었습니다.`);
    await fetchRegistrations();
  } catch {
    errorMessage.value = `${reg.name}님 거절에 실패했습니다.`;
  } finally {
    rejectLoading.value.delete(reg.id);
  }
}

async function bulkApprove() {
  if (!hasSelection.value) return;
  bulkApproveLoading.value = true;
  errorMessage.value = '';

  const targets = registrations.value.filter((r) => selectedIds.value.has(r.id));
  let successCount = 0;
  let failCount = 0;

  for (const reg of targets) {
    try {
      await api.post('/users', {
        student_id: reg.studentId,
        name: reg.name,
        college: reg.college,
        department: reg.department,
        phone: reg.phone,
      });
      await api.delete(`/users/register/${reg.id}`);
      successCount++;
    } catch {
      failCount++;
    }
  }

  selectedIds.value = new Set();
  if (failCount > 0) {
    errorMessage.value = `${successCount}명 승인, ${failCount}명 실패`;
  } else {
    showSuccess(`${successCount}명이 일괄 승인되었습니다.`);
  }
  await fetchRegistrations();
  bulkApproveLoading.value = false;
}

async function bulkReject() {
  if (!hasSelection.value) return;
  bulkRejectLoading.value = true;
  errorMessage.value = '';

  const targets = registrations.value.filter((r) => selectedIds.value.has(r.id));
  let successCount = 0;
  let failCount = 0;

  for (const reg of targets) {
    try {
      await api.delete(`/users/register/${reg.id}`);
      successCount++;
    } catch {
      failCount++;
    }
  }

  selectedIds.value = new Set();
  if (failCount > 0) {
    errorMessage.value = `${successCount}명 거절, ${failCount}명 실패`;
  } else {
    showSuccess(`${successCount}명의 신청이 일괄 거절되었습니다.`);
  }
  await fetchRegistrations();
  bulkRejectLoading.value = false;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  fetchRegistrations();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-gray-800">가입 신청 관리</h1>

      <!-- Bulk actions -->
      <div v-if="hasSelection" class="flex items-center gap-2">
        <span class="text-sm text-gray-500">{{ selectedIds.size }}명 선택</span>
        <button
          :disabled="bulkApproveLoading || bulkRejectLoading"
          class="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          @click="bulkApprove"
        >
          {{ bulkApproveLoading ? '처리 중...' : '일괄 승인' }}
        </button>
        <button
          :disabled="bulkApproveLoading || bulkRejectLoading"
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          @click="bulkReject"
        >
          {{ bulkRejectLoading ? '처리 중...' : '일괄 거절' }}
        </button>
      </div>
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

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
      />
    </div>

    <!-- Registrations Table -->
    <div
      v-else-if="registrations.length > 0"
      class="overflow-x-auto rounded-xl bg-white shadow-sm"
    >
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
            <th class="px-4 py-3 font-medium">학번</th>
            <th class="px-4 py-3 font-medium">이름</th>
            <th class="hidden px-4 py-3 font-medium md:table-cell">단과대</th>
            <th class="hidden px-4 py-3 font-medium lg:table-cell">학과</th>
            <th class="hidden px-4 py-3 font-medium sm:table-cell">연락처</th>
            <th class="hidden px-4 py-3 font-medium sm:table-cell">신청일</th>
            <th class="px-4 py-3 font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="reg in registrations"
            :key="reg.id"
            class="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.has(reg.id)"
                class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                @change="toggleSelection(reg.id)"
              />
            </td>
            <td class="px-4 py-3 text-gray-600">{{ reg.studentId }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ reg.name }}</td>
            <td class="hidden px-4 py-3 text-gray-600 md:table-cell">
              {{ reg.college }}
            </td>
            <td class="hidden px-4 py-3 text-gray-600 lg:table-cell">
              {{ reg.department }}
            </td>
            <td class="hidden px-4 py-3 text-gray-600 sm:table-cell">
              {{ reg.phone }}
            </td>
            <td class="hidden px-4 py-3 text-gray-600 sm:table-cell">
              {{ formatDate(reg.createdAt) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button
                  :disabled="approveLoading.has(reg.id) || rejectLoading.has(reg.id)"
                  class="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                  @click="approveRegistration(reg)"
                >
                  {{ approveLoading.has(reg.id) ? '...' : '승인' }}
                </button>
                <button
                  :disabled="approveLoading.has(reg.id) || rejectLoading.has(reg.id)"
                  class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  @click="rejectRegistration(reg)"
                >
                  {{ rejectLoading.has(reg.id) ? '...' : '거절' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="border-t px-4 py-3 text-sm text-gray-500">
        총 {{ registrations.length }}건의 가입 신청
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center text-gray-400">
      가입 신청이 없습니다
    </div>
  </div>
</template>
