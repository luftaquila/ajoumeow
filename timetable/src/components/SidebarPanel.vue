<template>
  <Drawer v-model:visible="drawerVisible" position="right" :style="{ width: '80%', maxWidth: '320px' }">
    <template #header>
      <span></span>
    </template>
    <div class="text-sm">
      <!-- Login form -->
      <div v-if="!isLoggedIn" class="text-center">
        <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <i class="far fa-id-badge text-2xl text-primary"></i>
        </div>
        <div class="flex flex-col items-center gap-3 mt-4">
          <InputText
            v-model="loginId"
            placeholder="학번"
            class="h-11 text-center text-lg w-full max-w-[200px] border-surface-border focus:border-primary transition-colors duration-200"
            @keyup.enter="onLogin"
          />
          <Button label="로그인" severity="info" class="w-full max-w-[200px]" @click="onLogin" />
          <a href="/apply"><Button label="회원 등록" severity="success" class="w-full max-w-[200px]" /></a>
        </div>
      </div>

      <!-- User info -->
      <div v-else>
        <div class="text-center mb-5">
          <div class="text-base font-semibold text-text">
            {{ user.name }}
            <span class="text-text-secondary font-normal">{{ user.role }}</span>
          </div>
          <div class="text-text-secondary mt-0.5">안녕하세요!</div>
          <div class="mt-3">
            <Button label="로그아웃" severity="danger" size="small" @click="onLogout" />
          </div>
        </div>

        <div class="border-t border-surface-border pt-4 mx-1 flex flex-col gap-4">
          <!-- Mileage section -->
          <div class="bg-surface-dim rounded-xl p-3.5">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">마일리지</div>
            <div class="flex justify-between text-text-secondary"><span>전체</span><span class="font-semibold text-text">{{ mileageTotal }}점</span></div>
            <div class="flex justify-between text-text-secondary mt-1"><span>이번 달</span><span class="font-semibold text-text">{{ mileageThis }}점</span></div>
          </div>

          <!-- Volunteer section -->
          <div class="bg-surface-dim rounded-xl p-3.5">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">봉사활동</div>
            <div class="flex justify-between text-text-secondary"><span>전체</span><span class="font-semibold text-text">{{ timeTotal }}시간</span></div>
            <div class="flex justify-between text-text-secondary mt-1"><span>이번 달</span><span class="font-semibold text-text">{{ timeThis }}시간</span></div>
          </div>

          <!-- 1365 ID -->
          <div class="bg-surface-dim rounded-xl p-3.5">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">1365 ID</div>
            <div class="text-text">{{ user['1365ID'] }}</div>
          </div>
        </div>

        <div class="border-t border-surface-border mt-4 pt-4 mx-1 flex flex-col items-center gap-3">
          <span class="text-primary cursor-pointer text-sm font-semibold hover:text-primary-dark transition-colors duration-200" @click="drawerVisible = false; $emit('open-record-history')">내 급식 기록</span>
          <a v-if="isAdmin" href="/console" class="text-primary cursor-pointer no-underline text-sm font-semibold hover:text-primary-dark transition-colors duration-200">관리자 콘솔</a>
        </div>
      </div>

      <div class="mt-10 text-center">
        <a href="/" class="text-text-muted cursor-pointer no-underline text-[10px]">
          &copy;{{ new Date().getFullYear() }} LUFT - AQUILA
        </a>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useAuth } from '../composables/useAuth.js'
import { useRecords } from '../composables/useRecords.js'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'open-record-history'])

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => { if (!val) emit('close') },
})

const { user, isLoggedIn, isAdmin, doLogin, logout, mileageTotal, mileageThis, timeTotal, timeThis } = useAuth()
const { load } = useRecords()

const loginId = ref('')

async function onLogin() {
  if (!loginId.value) return
  await doLogin(loginId.value)
  if (isLoggedIn.value) await load()
}

function onLogout() {
  logout()
  load()
}
</script>
