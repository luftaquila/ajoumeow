import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import api from '@/utils/api';

export interface User {
  id: number;
  studentId: string;
  name: string;
  role: string;
  semester: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => !!user.value && user.value.role !== '회원');

  async function login(studentId: string) {
    const { data } = await api.post('/auth/login', { student_id: studentId });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
  }

  async function autologin() {
    if (!token.value) return false;
    try {
      const { data } = await api.post('/auth/autologin');
      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('token', data.token);
      return true;
    } catch {
      logout();
      return false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  return { user, token, isLoggedIn, isAdmin, login, autologin, logout };
});
