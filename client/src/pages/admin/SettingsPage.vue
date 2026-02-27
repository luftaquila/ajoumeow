<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';

// Semester state
const semesters = ref<string[]>([]);
const selectedSemester = ref('');
const semesterLoading = ref(true);
const semesterSaving = ref(false);

// Announcement state
const announcement = ref('');
const announcementLoading = ref(true);
const announcementSaving = ref(false);

// Messages
const successMessage = ref('');
const errorMessage = ref('');

function showSuccess(msg: string) {
  successMessage.value = msg;
  errorMessage.value = '';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
}

function showError(msg: string) {
  errorMessage.value = msg;
  successMessage.value = '';
}

async function fetchSemesters() {
  semesterLoading.value = true;
  try {
    const [semesterList, currentSetting] = await Promise.all([
      api.get('/users/list', { params: { all: 'true' } }),
      api.get('/settings/currentSemester').catch(() => ({ data: { value: '' } })),
    ]);
    semesters.value = semesterList.data;
    selectedSemester.value = currentSetting.data.value ?? '';
  } catch {
    semesters.value = [];
  } finally {
    semesterLoading.value = false;
  }
}

async function fetchAnnouncement() {
  announcementLoading.value = true;
  try {
    const { data } = await api.get('/settings/announcement');
    announcement.value = data.value ?? '';
  } catch {
    announcement.value = '';
  } finally {
    announcementLoading.value = false;
  }
}

async function saveSemester() {
  if (!selectedSemester.value) return;
  semesterSaving.value = true;
  try {
    await api.put('/settings/currentSemester', { value: selectedSemester.value });
    showSuccess('현재 학기가 변경되었습니다.');
  } catch {
    showError('학기 변경에 실패했습니다.');
  } finally {
    semesterSaving.value = false;
  }
}

async function saveAnnouncement() {
  announcementSaving.value = true;
  try {
    await api.put('/settings/announcement', { value: announcement.value });
    showSuccess('공지사항이 저장되었습니다.');
  } catch {
    showError('공지사항 저장에 실패했습니다.');
  } finally {
    announcementSaving.value = false;
  }
}

onMounted(() => {
  fetchSemesters();
  fetchAnnouncement();
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">설정</h1>

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

    <!-- Current Semester Setting -->
    <div class="rounded-xl bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-700">현재 학기</h2>

      <div v-if="semesterLoading" class="flex items-center justify-center py-8">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
      </div>

      <div v-else class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-600">학기 선택</label>
          <select
            v-model="selectedSemester"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="" disabled>학기를 선택하세요</option>
            <option v-for="sem in semesters" :key="sem" :value="sem">
              {{ sem }}
            </option>
          </select>
        </div>
        <button
          :disabled="semesterSaving || !selectedSemester"
          class="rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          @click="saveSemester"
        >
          {{ semesterSaving ? '저장 중...' : '저장' }}
        </button>
      </div>
    </div>

    <!-- Announcement Setting -->
    <div class="rounded-xl bg-white p-6 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold text-gray-700">공지사항</h2>

      <div v-if="announcementLoading" class="flex items-center justify-center py-8">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
      </div>

      <div v-else class="space-y-4">
        <textarea
          v-model="announcement"
          rows="6"
          placeholder="공지사항을 입력하세요..."
          class="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div class="flex justify-end">
          <button
            :disabled="announcementSaving"
            class="rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            @click="saveAnnouncement"
          >
            {{ announcementSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
