<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';

interface Member {
  id: number;
  studentId: string;
  name: string;
  college: string;
  department: string;
  phone: string;
  volunteerId: string | null;
  role: string;
}

const startDate = ref('');
const endDate = ref('');
const maskOption = ref(false);

const memberList = ref<Member[]>([]);
const membersLoading = ref(true);
const selectedIds = ref<Set<number>>(new Set());

const generating = ref(false);
const resultUrl = ref('');
const errorMessage = ref('');
const successMessage = ref('');

const allSelected = computed({
  get: () =>
    memberList.value.length > 0 &&
    selectedIds.value.size === memberList.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedIds.value = new Set(memberList.value.map((m) => m.id));
    } else {
      selectedIds.value = new Set();
    }
  },
});

const eligibleCount = computed(
  () => memberList.value.filter((m) => m.volunteerId && selectedIds.value.has(m.id)).length,
);

const canGenerate = computed(
  () => startDate.value && endDate.value && selectedIds.value.size > 0 && !generating.value,
);

function toggleSelection(id: number) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedIds.value = next;
}

function setDateRange(type: 'thisMonth' | 'lastMonth') {
  const now = new Date();
  if (type === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startDate.value = start.toISOString().slice(0, 10);
    endDate.value = end.toISOString().slice(0, 10);
  } else {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    startDate.value = start.toISOString().slice(0, 10);
    endDate.value = end.toISOString().slice(0, 10);
  }
}

async function fetchMembers() {
  membersLoading.value = true;
  try {
    const { data } = await api.get('/users/list');
    memberList.value = data;
    // Select all by default
    selectedIds.value = new Set(data.map((m: Member) => m.id));
  } catch {
    memberList.value = [];
  } finally {
    membersLoading.value = false;
  }
}

async function generateCertificate() {
  if (!canGenerate.value) return;

  generating.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  resultUrl.value = '';

  try {
    const selectedStudentIds = memberList.value
      .filter((m) => selectedIds.value.has(m.id))
      .map((m) => m.studentId);

    const { data } = await api.get('/verify/1365', {
      params: {
        start: startDate.value,
        end: endDate.value,
        mask: maskOption.value ? 'true' : 'false',
        members: selectedStudentIds.join(','),
      },
    });

    if (data.url) {
      resultUrl.value = data.url;
      successMessage.value = '1365 인증서가 생성되었습니다.';
    } else if (data.error) {
      errorMessage.value = data.error;
    } else {
      successMessage.value = '요청이 완료되었습니다.';
    }
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: string } } };
    errorMessage.value =
      axiosErr.response?.data?.error ?? '인증서 생성에 실패했습니다.';
  } finally {
    generating.value = false;
  }
}

onMounted(() => {
  fetchMembers();
  // Default to this month
  setDateRange('thisMonth');
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">1365 봉사활동 인증서</h1>

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

    <!-- Date Range Selection -->
    <div class="rounded-xl bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-700">기간 선택</h2>

      <div class="mb-3 flex flex-wrap gap-2">
        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          @click="setDateRange('thisMonth')"
        >
          이번 달
        </button>
        <button
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          @click="setDateRange('lastMonth')"
        >
          지난 달
        </button>
      </div>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-600">시작일</label>
          <input
            v-model="startDate"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-600">종료일</label>
          <input
            v-model="endDate"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Member Selection -->
    <div class="rounded-xl bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-700">대상 회원</h2>
        <span class="text-sm text-gray-500">
          {{ selectedIds.size }}명 선택 (1365 ID 등록: {{ eligibleCount }}명)
        </span>
      </div>

      <div v-if="membersLoading" class="flex items-center justify-center py-8">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
      </div>

      <template v-else>
        <div class="mb-3">
          <label class="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              :checked="allSelected"
              class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              @change="allSelected = ($event.target as HTMLInputElement).checked"
            />
            전체 선택
          </label>
        </div>

        <div class="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
          <table class="w-full text-sm">
            <thead class="sticky top-0">
              <tr class="border-b bg-gray-50 text-left text-xs text-gray-500">
                <th class="px-3 py-2 font-medium"></th>
                <th class="px-3 py-2 font-medium">이름</th>
                <th class="px-3 py-2 font-medium">학번</th>
                <th class="hidden px-3 py-2 font-medium sm:table-cell">1365 ID</th>
                <th class="hidden px-3 py-2 font-medium md:table-cell">역할</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="member in memberList"
                :key="member.id"
                class="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
                :class="{ 'opacity-50': !member.volunteerId }"
              >
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(member.id)"
                    class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    @change="toggleSelection(member.id)"
                  />
                </td>
                <td class="px-3 py-2 font-medium text-gray-800">{{ member.name }}</td>
                <td class="px-3 py-2 text-gray-600">{{ member.studentId }}</td>
                <td class="hidden px-3 py-2 text-gray-600 sm:table-cell">
                  <span v-if="member.volunteerId">{{ member.volunteerId }}</span>
                  <span v-else class="text-xs text-red-400">미등록</span>
                </td>
                <td class="hidden px-3 py-2 text-gray-600 md:table-cell">{{ member.role }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-2 text-xs text-gray-400">
          1365 ID가 미등록된 회원은 인증서에 포함되지 않습니다.
        </p>
      </template>
    </div>

    <!-- Options & Generate -->
    <div class="rounded-xl bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-700">옵션</h2>

      <div class="mb-6">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input
            v-model="maskOption"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          개인정보 마스킹
        </label>
        <p class="ml-6 mt-1 text-xs text-gray-400">
          이름, 연락처 등의 개인정보를 마스킹 처리합니다.
        </p>
      </div>

      <button
        :disabled="!canGenerate"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50 sm:w-auto"
        @click="generateCertificate"
      >
        <template v-if="generating">
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          생성 중...
        </template>
        <template v-else> 인증서 생성 </template>
      </button>
    </div>

    <!-- Result -->
    <div
      v-if="resultUrl"
      class="rounded-xl bg-green-50 p-6 shadow-sm"
    >
      <h2 class="mb-3 text-lg font-semibold text-green-800">생성 완료</h2>
      <p class="mb-3 text-sm text-green-700">
        인증서가 생성되었습니다. 아래 링크를 클릭하면 생성된 파일을 확인할 수 있습니다.
      </p>
      <a
        :href="resultUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
      >
        파일 열기
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  </div>
</template>
