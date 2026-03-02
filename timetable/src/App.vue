<template>
  <div class="main-container-wrapper">
    <HeaderNav
      @open-notice="openModal('notice')"
      @open-help="openModal('help')"
      @open-map="openModal('map')"
      @open-sidebar="sidebarOpen = true"
    />

    <main>
      <div class="calendar-container">
        <div class="calendar-container__header" style="display: block; text-align: center; padding: .5rem 0 .25rem;">
          <img src="/res/image/headline_blue.png" style="width: 8rem" />
        </div>
        <div class="calendar-container__body">
          <div class="calendar-table">
            <div class="calendar-table__header">
              <div class="calendar-table__row">
                <div class="calendar-table__col" style="color: #ff6666">S</div>
                <div class="calendar-table__col">M</div>
                <div class="calendar-table__col">T</div>
                <div class="calendar-table__col">W</div>
                <div class="calendar-table__col">T</div>
                <div class="calendar-table__col">F</div>
                <div class="calendar-table__col" style="color: #0080ff">S</div>
              </div>
            </div>
            <CalendarGrid
              @add-record="onAddRecord"
            />
          </div>
        </div>
      </div>

      <ContentArea
        @delete-record="onDeleteRecord"
      />
    </main>

    <div style="padding: 1rem; text-align: center">
      이 사이트가 마음에 들지 않는 분은 <a class="rainbow" style="cursor: pointer" @click="openModal('recruit')">여기</a>를 누르세요
    </div>
  </div>

  <SidebarPanel
    :visible="sidebarOpen"
    @close="sidebarOpen = false"
    @open-record-history="openModal('recordHistory')"
  />

  <BaseModal :visible="isOpen('notice')" title="공지사항" @close="closeModal('notice')">
    <NoticeModal />
  </BaseModal>
  <BaseModal :visible="isOpen('help')" title="도움말" @close="closeModal('help')">
    <HelpModal />
  </BaseModal>
  <BaseModal :visible="isOpen('map')" title="지도" wide @close="onCloseMap">
    <MapModal :visible="isOpen('map')" />
  </BaseModal>
  <BaseModal :visible="isOpen('recordHistory')" title="급식 기록" @close="closeModal('recordHistory')">
    <RecordHistoryModal />
  </BaseModal>
  <BaseModal :visible="isOpen('recruit')" title="개발자 구해요!" wide @close="closeModal('recruit')">
    <RecruitModal />
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCalendar } from './composables/useCalendar.js'
import { useRecords } from './composables/useRecords.js'
import { useAuth } from './composables/useAuth.js'
import { useWeather } from './composables/useWeather.js'
import { useMap } from './composables/useMap.js'
import { useModal } from './composables/useModal.js'
import * as apiClient from './api/index.js'
import Cookies from 'js-cookie'

import HeaderNav from './components/HeaderNav.vue'
import CalendarGrid from './components/CalendarGrid.vue'
import ContentArea from './components/ContentArea.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import BaseModal from './components/modals/BaseModal.vue'
import NoticeModal from './components/modals/NoticeModal.vue'
import HelpModal from './components/modals/HelpModal.vue'
import MapModal from './components/modals/MapModal.vue'
import RecordHistoryModal from './components/modals/RecordHistoryModal.vue'
import RecruitModal from './components/modals/RecruitModal.vue'

const { initCalendar, selectedDate, isSelectedActive } = useCalendar()
const { load, addRecord, deleteRecord } = useRecords()
const { doAutoLogin, user } = useAuth()
const { loadWeather } = useWeather()
const { resetGPS } = useMap()
const { openModal, closeModal, isOpen } = useModal()

const sidebarOpen = ref(false)

async function onAddRecord(course) {
  if (!isSelectedActive.value) return
  await addRecord({ date: selectedDate.value, course })
}

async function onDeleteRecord(target) {
  await deleteRecord(target)
}

function onCloseMap() {
  resetGPS()
  closeModal('map')
}

onMounted(async () => {
  initCalendar()
  loadWeather()

  const loggedIn = await doAutoLogin()
  await load()

  if (loggedIn) {
    // Load notice
    try {
      const res = await apiClient.getSetting('notice')
      const notice = res.data.split('$')
      const noticeContent = notice[1]
      // Store notice for NoticeModal
      window.__noticeContent = noticeContent
      if (user.value && Cookies.get('versionInfo') !== notice[0]) {
        Cookies.set('versionInfo', notice[0], { expires: 7 })
        openModal('notice')
      }
    } catch (e) { /* ignore */ }
  } else {
    sidebarOpen.value = true
  }
})
</script>
