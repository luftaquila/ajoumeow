<template>
  <Drawer v-model:visible="drawerVisible" position="right" :style="{ width: '45%', maxWidth: '250px' }">
    <template #header>
      <span></span>
    </template>
    <div class="text-sm text-center">
      <!-- Login form -->
      <div v-if="!isLoggedIn">
        <div class="flex items-center justify-center">
          <i class="far fa-id-badge h-6 text-2xl mr-2"></i>
          <InputText
            v-model="loginId"
            placeholder="학번"
            class="h-6 text-center text-xl w-28"
            @keyup.enter="onLogin"
          />
        </div><br>
        <Button label="로그인" severity="info" size="small" @click="onLogin" /><br>
        <a href="/apply"><Button label="회원 등록" severity="success" size="small" /></a><br><br>
      </div>

      <!-- User info -->
      <div v-else>
        <span class="text-base">
          <span>{{ user.name }}</span>&nbsp;
          <span>{{ user.role }}</span>님<br>안녕하세요!
        </span><br><br>
        <Button label="로그아웃" severity="danger" size="small" @click="onLogout" /><br><br><br><br>
        <table class="w-[90%] mx-[5%]">
          <colgroup>
            <col width="10%" /><col width="50%" /><col width="40%" />
          </colgroup>
          <tr><td colspan="2" class="text-left">내 마일리지</td><td></td></tr>
          <tr><td>&nbsp;</td><td class="text-left">전체</td><td class="text-right">{{ mileageTotal }}점</td></tr>
          <tr><td>&nbsp;</td><td class="text-left">이번 달</td><td class="text-right">{{ mileageThis }}점</td></tr>
          <tr class="h-2"><td colspan="3"></td></tr>
          <tr><td colspan="2" class="text-left">내 봉사활동</td><td></td></tr>
          <tr><td>&nbsp;</td><td class="text-left">전체</td><td class="text-right">{{ timeTotal }}시간</td></tr>
          <tr><td>&nbsp;</td><td class="text-left">이번 달</td><td class="text-right">{{ timeThis }}시간</td></tr>
          <tr class="h-2"><td colspan="3"></td></tr>
          <tr><td colspan="2" class="text-left">내 1365 ID</td><td><div class="text-right">{{ user['1365ID'] }}</div></td></tr>
        </table><br><br>
        <span class="text-[#0366d6] cursor-pointer" @click="drawerVisible = false; $emit('open-record-history')">내 급식 기록</span><br><br>
        <a v-if="isAdmin" href="/console" class="text-[#0366d6] cursor-pointer no-underline"><br>관리자 콘솔</a><br>
      </div>
      <br><br><br>
      <a href="/" class="text-black cursor-pointer no-underline text-xs">
        &copy;{{ new Date().getFullYear() }} LUFT - AQUILA
      </a><br><br>
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
