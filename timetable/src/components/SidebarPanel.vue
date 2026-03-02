<template>
  <div v-if="visible" id="sidebar" style="z-index: 20; position: fixed; top: 0; left: 0; height: 100%; width: 100%;">
    <div class="sidebar_overlay" @click.self="$emit('close')">
      <div class="sidebar_container animate-right" style="font-size: 0.8rem; padding: 10px; text-align: center;">
        <span @click="$emit('close')" style="position: absolute; font-size: 1.8rem; margin: 0.5rem; height: 2rem; width: 2rem; text-align: center; top: 0; right: 0; cursor: pointer;">
          <i class="fal fa-times-circle"></i>
        </span>
        <br><br><br><br><br><br>

        <!-- Login form -->
        <div v-if="!isLoggedIn" id="loginForm">
          <div style="display: flex; align-items: center; justify-content: center;">
            <i style="height: 1.5rem; font-size: 1.5rem; margin-right: 0.5rem;" class="far fa-id-badge"></i>
            <input
              v-model="loginId"
              type="number"
              style="height: 1.5rem; text-align: center; padding: 0 0.2rem; font-size: 1.2rem; width: 7rem; border: none; border-bottom: solid 2px gray;"
              placeholder="학번"
              @keyup.enter="onLogin"
            />
          </div><br>
          <a class="btn blue" style="font-size: 0.8rem; cursor: pointer" @click="onLogin">로그인</a><br>
          <a @click="window.location.href = '/apply'" class="btn green" style="font-size: 0.8rem; cursor: pointer">회원 등록</a><br><br>
        </div>

        <!-- User info -->
        <div v-else id="userInfo">
          <span style="font-size: 1rem;">
            <span>{{ user.name }}</span>&nbsp;
            <span>{{ user.role }}</span>님<br>안녕하세요!
          </span><br><br>
          <a class="btn red" style="font-size: 0.8rem; cursor: pointer" @click="onLogout">로그아웃</a><br><br><br><br>
          <table style="width: 90%; margin: 0 5%;">
            <colgroup>
              <col width="10%" /><col width="50%" /><col width="40%" />
            </colgroup>
            <tr><td colspan="2" style="text-align: left">내 마일리지</td><td></td></tr>
            <tr><td>&nbsp;</td><td style="text-align: left">전체</td><td style="text-align: right;">{{ mileageTotal }}점</td></tr>
            <tr><td>&nbsp;</td><td style="text-align: left">이번 달</td><td style="text-align: right;">{{ mileageThis }}점</td></tr>
            <tr style="height: 0.5rem"><td colspan="3"></td></tr>
            <tr><td colspan="2" style="text-align: left">내 봉사활동</td><td></td></tr>
            <tr><td>&nbsp;</td><td style="text-align: left">전체</td><td style="text-align: right;">{{ timeTotal }}시간</td></tr>
            <tr><td>&nbsp;</td><td style="text-align: left">이번 달</td><td style="text-align: right;">{{ timeThis }}시간</td></tr>
            <tr style="height: 0.5rem"><td colspan="3"></td></tr>
            <tr><td colspan="2" style="text-align: left">내 1365 ID</td><td><div style="text-align: right;">{{ user['1365ID'] }}</div></td></tr>
          </table><br><br>
          <span style="color: #0366d6; cursor: pointer" @click="$emit('close'); $emit('open-record-history')">내 급식 기록</span><br><br>
          <a v-if="isAdmin" @click="window.location.href = '/console'" style="color: #0366d6; cursor: pointer; text-decoration: none;"><br>관리자 콘솔</a><br>
        </div>
        <br><br><br>
        <a @click="window.location.href = '/'" style="color: black; cursor: pointer; text-decoration: none; font-size: 0.7rem">
          &copy;{{ new Date().getFullYear() }} LUFT - AQUILA
        </a><br><br>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useRecords } from '../composables/useRecords.js'

defineProps({ visible: Boolean })
defineEmits(['close', 'open-record-history'])

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
