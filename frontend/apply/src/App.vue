<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-lg mx-auto text-center">
      <div class="card-section py-12">
        <div class="i-lucide-user-check text-5xl text-primary mx-auto mb-4"></div>
        <h2 class="text-xl font-bold mb-2">웹사이트 가입은 급식표에서 받아요</h2>
        <p class="text-text-secondary text-sm mb-6">
          급식표에서 구글 계정으로 로그인하면 신규·기존 회원 모두 가입 신청을 할 수 있습니다.<br>
          임원진이 승인하면 바로 급식을 신청할 수 있어요.
        </p>
        <a href="/timetable" class="btn-blue">급식표로 가기</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from '../../shared/composables/useTheme.js'

// This page used to register members directly, without Google login or approval.
// Old links still land here, so point them to the timetable's sign-up.
const { initTheme } = useTheme()

onMounted(initTheme)
</script>
