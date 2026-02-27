<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

interface RecordItem {
  id: number;
  memberId: number;
  date: string;
  course: string;
  createdAt: string;
  memberName: string;
}

const auth = useAuthStore();

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth()); // 0-indexed
const records = ref<RecordItem[]>([]);
const loading = ref(true);

// Modal state
const showModal = ref(false);
const modalDate = ref('');
const modalCourse = ref('1코스');
const submitting = ref(false);
const errorMsg = ref('');

// Cancel confirmation
const showCancelConfirm = ref(false);
const cancelTarget = ref<RecordItem | null>(null);
const cancelling = ref(false);

const courseOptions = ['1코스', '2코스', '3코스'];

const courseColors: Record<string, { bg: string; text: string; dot: string }> = {
  '1코스': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  '2코스': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  '3코스': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
};

const monthLabel = computed(() => {
  return `${currentYear.value}년 ${currentMonth.value + 1}월`;
});

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

interface CalendarDay {
  date: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const calendarDays = computed((): CalendarDay[] => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: CalendarDay[] = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 12 : month;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: d, dateStr, isCurrentMonth: true, isToday: dateStr === todayStr });
  }

  // Next month padding (fill to complete last week)
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const nextMonth = month + 2 > 12 ? 1 : month + 2;
    const nextYear = month + 2 > 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: d, dateStr, isCurrentMonth: false, isToday: dateStr === todayStr });
    }
  }

  return days;
});

const recordsByDate = computed(() => {
  const map: Record<string, Record<string, RecordItem[]>> = {};
  for (const record of records.value) {
    if (!map[record.date]) {
      map[record.date] = {};
    }
    if (!map[record.date][record.course]) {
      map[record.date][record.course] = [];
    }
    map[record.date][record.course].push(record);
  }
  return map;
});

function getCoursesForDate(dateStr: string): string[] {
  const dateRecords = recordsByDate.value[dateStr];
  if (!dateRecords) return [];
  return Object.keys(dateRecords).sort();
}

function getRecordsForDateCourse(dateStr: string, course: string): RecordItem[] {
  return recordsByDate.value[dateStr]?.[course] ?? [];
}

function isOwnRecord(record: RecordItem): boolean {
  return !!auth.user && record.memberId === auth.user.id;
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function goToToday() {
  const now = new Date();
  currentYear.value = now.getFullYear();
  currentMonth.value = now.getMonth();
}

async function fetchRecords() {
  loading.value = true;
  try {
    const year = currentYear.value;
    const month = currentMonth.value;
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data } = await api.get('/records', { params: { from, to } });
    records.value = data;
  } catch {
    records.value = [];
  } finally {
    loading.value = false;
  }
}

function openApplyModal(dateStr: string) {
  if (!auth.isLoggedIn) return;
  modalDate.value = dateStr;
  modalCourse.value = '1코스';
  errorMsg.value = '';
  showModal.value = true;
}

async function submitRecord() {
  submitting.value = true;
  errorMsg.value = '';
  try {
    await api.post('/records', {
      date: modalDate.value,
      course: modalCourse.value,
    });
    showModal.value = false;
    await fetchRecords();
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    errorMsg.value = err.response?.data?.error || '신청에 실패했습니다.';
  } finally {
    submitting.value = false;
  }
}

function openCancelConfirm(record: RecordItem) {
  if (!isOwnRecord(record)) return;
  cancelTarget.value = record;
  showCancelConfirm.value = true;
}

async function confirmCancel() {
  if (!cancelTarget.value) return;
  cancelling.value = true;
  try {
    await api.delete(`/records/${cancelTarget.value.id}`);
    showCancelConfirm.value = false;
    cancelTarget.value = null;
    await fetchRecords();
  } catch {
    // silently handle
  } finally {
    cancelling.value = false;
  }
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

watch([currentYear, currentMonth], () => {
  fetchRecords();
});

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header with navigation -->
    <div class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <button
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        @click="prevMonth"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold text-gray-800 sm:text-2xl">{{ monthLabel }}</h1>
        <button
          class="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          @click="goToToday"
        >
          오늘
        </button>
      </div>

      <button
        class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        @click="nextMonth"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Course legend -->
    <div class="flex flex-wrap gap-3 px-1">
      <div
        v-for="(colors, course) in courseColors"
        :key="course"
        class="flex items-center gap-1.5"
      >
        <span class="h-2.5 w-2.5 rounded-full" :class="colors.dot" />
        <span class="text-xs text-gray-600">{{ course }}</span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="overflow-hidden rounded-xl bg-white shadow-sm">
      <!-- Weekday header -->
      <div class="grid grid-cols-7 border-b bg-gray-50">
        <div
          v-for="(day, idx) in weekdays"
          :key="day"
          class="py-2 text-center text-xs font-medium"
          :class="idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-500'"
        >
          {{ day }}
        </div>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>

      <!-- Calendar body -->
      <div v-else class="grid grid-cols-7">
        <div
          v-for="(day, idx) in calendarDays"
          :key="day.dateStr"
          class="min-h-[80px] border-b border-r p-1.5 sm:min-h-[100px] sm:p-2"
          :class="[
            !day.isCurrentMonth ? 'bg-gray-50' : '',
            idx % 7 === 6 ? 'border-r-0' : '',
            day.isCurrentMonth && auth.isLoggedIn ? 'cursor-pointer hover:bg-orange-50/50' : '',
          ]"
          @click="day.isCurrentMonth && auth.isLoggedIn ? openApplyModal(day.dateStr) : undefined"
        >
          <!-- Date number -->
          <div class="mb-1 flex items-center justify-between">
            <span
              class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:text-sm"
              :class="[
                day.isToday ? 'bg-primary-500 text-white' : '',
                !day.isToday && !day.isCurrentMonth ? 'text-gray-300' : '',
                !day.isToday && day.isCurrentMonth && idx % 7 === 0 ? 'text-red-400' : '',
                !day.isToday && day.isCurrentMonth && idx % 7 === 6 ? 'text-blue-400' : '',
                !day.isToday && day.isCurrentMonth && idx % 7 !== 0 && idx % 7 !== 6 ? 'text-gray-700' : '',
              ]"
            >
              {{ day.date }}
            </span>
          </div>

          <!-- Records for this date -->
          <div v-if="day.isCurrentMonth" class="space-y-0.5">
            <div
              v-for="course in getCoursesForDate(day.dateStr)"
              :key="course"
              class="rounded px-1 py-0.5"
              :class="courseColors[course]?.bg ?? 'bg-gray-50'"
            >
              <div class="flex items-center gap-1">
                <span
                  class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  :class="courseColors[course]?.dot ?? 'bg-gray-400'"
                />
                <span
                  class="truncate text-[10px] font-medium sm:text-xs"
                  :class="courseColors[course]?.text ?? 'text-gray-700'"
                >
                  {{ course }}
                </span>
                <span class="text-[10px] text-gray-400 sm:text-xs">
                  {{ getRecordsForDateCourse(day.dateStr, course).length }}
                </span>
              </div>
              <!-- Names - hidden on mobile, shown on sm+ -->
              <div class="mt-0.5 hidden flex-wrap gap-0.5 sm:flex">
                <span
                  v-for="record in getRecordsForDateCourse(day.dateStr, course)"
                  :key="record.id"
                  class="rounded px-1 text-[10px]"
                  :class="[
                    isOwnRecord(record)
                      ? 'cursor-pointer bg-primary-100 font-medium text-primary-700 hover:bg-primary-200'
                      : 'bg-white/70 text-gray-600',
                  ]"
                  @click.stop="isOwnRecord(record) ? openCancelConfirm(record) : undefined"
                >
                  {{ record.memberName }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showModal = false"
      >
        <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h2 class="mb-4 text-lg font-bold text-gray-800">급식 신청</h2>

          <div class="mb-4">
            <label class="mb-1 block text-sm font-medium text-gray-700">날짜</label>
            <div class="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {{ formatDate(modalDate) }}
            </div>
          </div>

          <div class="mb-6">
            <label class="mb-1 block text-sm font-medium text-gray-700">코스</label>
            <select
              v-model="modalCourse"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div v-if="errorMsg" class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {{ errorMsg }}
          </div>

          <div class="flex gap-2">
            <button
              class="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              :disabled="submitting"
              @click="showModal = false"
            >
              취소
            </button>
            <button
              class="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
              :disabled="submitting"
              @click="submitRecord"
            >
              {{ submitting ? '신청 중...' : '신청하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="showCancelConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showCancelConfirm = false"
      >
        <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h2 class="mb-2 text-lg font-bold text-gray-800">급식 취소</h2>
          <p v-if="cancelTarget" class="mb-6 text-sm text-gray-600">
            {{ formatDate(cancelTarget.date) }} {{ cancelTarget.course }} 신청을 취소하시겠습니까?
          </p>

          <div class="flex gap-2">
            <button
              class="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              :disabled="cancelling"
              @click="showCancelConfirm = false"
            >
              아니오
            </button>
            <button
              class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              :disabled="cancelling"
              @click="confirmCancel"
            >
              {{ cancelling ? '취소 중...' : '취소하기' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
