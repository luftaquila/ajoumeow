import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/utils/api';

export const useSettingsStore = defineStore('settings', () => {
  const announcement = ref<string>('');
  const currentSemester = ref<string>('');

  async function fetchAnnouncement() {
    try {
      const { data } = await api.get('/settings/announcement');
      announcement.value = data.value ?? '';
    } catch {
      announcement.value = '';
    }
  }

  async function fetchCurrentSemester() {
    try {
      const { data } = await api.get('/settings/currentSemester');
      currentSemester.value = data.value ?? '';
    } catch {
      currentSemester.value = '';
    }
  }

  return { announcement, currentSemester, fetchAnnouncement, fetchCurrentSemester };
});
