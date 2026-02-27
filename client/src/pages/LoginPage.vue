<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const studentId = ref('');
const errorMessage = ref('');
const loading = ref(false);

onMounted(async () => {
  if (auth.isLoggedIn) {
    router.replace({ name: 'home' });
    return;
  }
  if (localStorage.getItem('token')) {
    loading.value = true;
    const success = await auth.autologin();
    loading.value = false;
    if (success) {
      router.replace({ name: 'home' });
    }
  }
});

async function handleLogin() {
  errorMessage.value = '';
  const trimmed = studentId.value.trim();
  if (!trimmed) {
    errorMessage.value = '학번을 입력해주세요.';
    return;
  }

  loading.value = true;
  try {
    await auth.login(trimmed);
    router.replace({ name: 'home' });
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr.response?.status === 401) {
      errorMessage.value = '등록되지 않은 학번입니다.';
    } else {
      errorMessage.value = '로그인에 실패했습니다. 다시 시도해주세요.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-8 text-center">
        <span class="text-5xl">🐾</span>
        <h1 class="mt-4 text-2xl font-bold text-gray-900">아주냥 로그인</h1>
        <p class="mt-2 text-sm text-gray-500">학번을 입력하여 로그인하세요</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="studentId" class="mb-1 block text-sm font-medium text-gray-700">
            학번
          </label>
          <input
            id="studentId"
            v-model="studentId"
            type="text"
            inputmode="numeric"
            placeholder="예: 202012345"
            autocomplete="username"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading"
        >
          <span v-if="loading">로그인 중...</span>
          <span v-else>로그인</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">
          아직 회원이 아니신가요?
          <RouterLink to="/register" class="font-medium text-primary-600 hover:text-primary-500">
            가입 신청
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
