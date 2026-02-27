<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '@/utils/api';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  ip: string | null;
  endpoint: string | null;
  method: string | null;
  status: number | null;
  description: string | null;
  query: string | null;
  result: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const logs = ref<LogEntry[]>([]);
const loading = ref(true);
const pagination = ref<Pagination>({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
});

const filterFrom = ref('');
const filterTo = ref('');
const filterLevel = ref('');
const filterSearch = ref('');

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

async function fetchLogs(page = 1) {
  loading.value = true;
  try {
    const params: Record<string, string> = { page: String(page), limit: '50' };
    if (filterFrom.value) params.from = filterFrom.value;
    if (filterTo.value) params.to = filterTo.value;
    if (filterLevel.value) params.level = filterLevel.value;
    if (filterSearch.value.trim()) params.search = filterSearch.value.trim();

    const { data } = await api.get('/logs', { params });
    logs.value = data.logs;
    pagination.value = data.pagination;
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  fetchLogs(1);
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  fetchLogs(page);
}

function formatTimestamp(ts: string) {
  if (!ts) return '';
  // Show date + time
  return ts.replace('T', ' ').slice(0, 19);
}

// Debounce search input
watch(filterSearch, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => applyFilters(), 400);
});

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">서버 로그</h1>

    <!-- Filters -->
    <div class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <div class="flex-1">
        <label class="mb-1 block text-xs font-medium text-gray-500">시작일</label>
        <input
          v-model="filterFrom"
          type="date"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          @change="applyFilters"
        />
      </div>
      <div class="flex-1">
        <label class="mb-1 block text-xs font-medium text-gray-500">종료일</label>
        <input
          v-model="filterTo"
          type="date"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          @change="applyFilters"
        />
      </div>
      <div class="flex-1">
        <label class="mb-1 block text-xs font-medium text-gray-500">로그 레벨</label>
        <select
          v-model="filterLevel"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          @change="applyFilters"
        >
          <option value="">전체</option>
          <option value="info">info</option>
          <option value="error">error</option>
        </select>
      </div>
      <div class="flex-[2]">
        <label class="mb-1 block text-xs font-medium text-gray-500">키워드 검색</label>
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="filterSearch"
            type="text"
            placeholder="설명 검색..."
            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
      />
    </div>

    <!-- Logs Table -->
    <div v-else-if="logs.length > 0" class="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-xs text-gray-500">
            <th class="px-4 py-3 font-medium">시간</th>
            <th class="px-4 py-3 font-medium">레벨</th>
            <th class="hidden px-4 py-3 font-medium sm:table-cell">IP</th>
            <th class="px-4 py-3 font-medium">엔드포인트</th>
            <th class="hidden px-4 py-3 font-medium md:table-cell">메소드</th>
            <th class="hidden px-4 py-3 font-medium sm:table-cell">상태</th>
            <th class="px-4 py-3 font-medium">설명</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
          >
            <td class="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
              {{ formatTimestamp(log.timestamp) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  log.level === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                "
              >
                {{ log.level }}
              </span>
            </td>
            <td class="hidden whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500 sm:table-cell">
              {{ log.ip ?? '-' }}
            </td>
            <td class="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-gray-700">
              {{ log.endpoint ?? '-' }}
            </td>
            <td class="hidden px-4 py-3 md:table-cell">
              <span
                v-if="log.method"
                class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600"
              >
                {{ log.method }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="hidden px-4 py-3 sm:table-cell">
              <span
                v-if="log.status != null"
                class="font-mono text-xs"
                :class="
                  log.status >= 400
                    ? 'text-red-600'
                    : log.status >= 300
                      ? 'text-yellow-600'
                      : 'text-green-600'
                "
              >
                {{ log.status }}
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="max-w-[300px] truncate px-4 py-3 text-gray-600">
              {{ log.description ?? '-' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t px-4 py-3">
        <span class="text-sm text-gray-500">
          총 {{ pagination.total.toLocaleString() }}건
        </span>

        <div class="flex items-center gap-2">
          <button
            :disabled="pagination.page <= 1"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="goToPage(pagination.page - 1)"
          >
            이전
          </button>

          <span class="text-sm text-gray-600">
            {{ pagination.page }} / {{ pagination.totalPages }}
          </span>

          <button
            :disabled="pagination.page >= pagination.totalPages"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="goToPage(pagination.page + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center text-gray-400">로그가 없습니다</div>
  </div>
</template>
