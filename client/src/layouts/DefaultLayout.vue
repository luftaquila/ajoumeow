<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const mobileMenuOpen = ref(false);

const navLinks = [
  { to: '/', label: '홈' },
  { to: '/timetable', label: '급식일정' },
  { to: '/gallery', label: '갤러리' },
  { to: '/stats', label: '통계' },
];

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

function handleLogout() {
  auth.logout();
  closeMobileMenu();
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo / Club name -->
          <RouterLink
            to="/"
            class="flex items-center gap-2 text-xl font-bold text-primary-600"
            @click="closeMobileMenu"
          >
            <span class="text-2xl">🐾</span>
            <span>아주냥</span>
          </RouterLink>

          <!-- Desktop navigation -->
          <nav class="hidden items-center gap-1 md:flex">
            <RouterLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
              active-class="!text-primary-600 !bg-primary-50"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </RouterLink>

            <RouterLink
              v-if="auth.isAdmin"
              to="/admin"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
              active-class="!text-primary-600 !bg-primary-50"
            >
              관리자
            </RouterLink>
          </nav>

          <!-- Desktop auth button -->
          <div class="hidden items-center md:flex">
            <template v-if="auth.isLoggedIn">
              <span class="mr-3 text-sm text-gray-600">
                {{ auth.user?.name }}
              </span>
              <button
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                @click="handleLogout"
              >
                로그아웃
              </button>
            </template>
            <RouterLink
              v-else
              to="/login"
              class="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              로그인
            </RouterLink>
          </div>

          <!-- Mobile hamburger button -->
          <button
            class="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            :aria-expanded="mobileMenuOpen"
            aria-label="메뉴 열기"
            @click="toggleMobileMenu"
          >
            <!-- Hamburger icon -->
            <svg
              v-if="!mobileMenuOpen"
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <!-- Close icon -->
            <svg
              v-else
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="border-t border-gray-200 md:hidden">
        <div class="space-y-1 px-4 pb-3 pt-2">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
            active-class="!text-primary-600 !bg-primary-50"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </RouterLink>

          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary-600"
            active-class="!text-primary-600 !bg-primary-50"
            @click="closeMobileMenu"
          >
            관리자
          </RouterLink>

          <div class="border-t border-gray-200 pt-3">
            <template v-if="auth.isLoggedIn">
              <p class="mb-2 px-3 text-sm text-gray-600">
                {{ auth.user?.name }}님
              </p>
              <button
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                @click="handleLogout"
              >
                로그아웃
              </button>
            </template>
            <RouterLink
              v-else
              to="/login"
              class="block rounded-lg bg-primary-500 px-3 py-2 text-center text-base font-medium text-white transition-colors hover:bg-primary-600"
              @click="closeMobileMenu"
            >
              로그인
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 bg-gray-50">
      <div
        class="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6 lg:px-8"
      >
        <p>&copy; 아주냥 AjouMeow - 아주대학교 길고양이 돌봄 동아리</p>
      </div>
    </footer>
  </div>
</template>
