<template>
  <div class="bg-[#F8FAFA] min-w-[320px] min-h-[568px] max-w-[414px] overflow-y-auto mx-auto md:shadow-[0px_32px_47px_rgba(32,23,23,0.09)] md:my-6">
    <HeaderNav
      @open-notice="openModal('notice')"
      @open-help="openModal('help')"
      @open-map="openModal('map')"
      @open-sidebar="sidebarOpen = true"
    />

    <main>
      <div class="bg-white pb-4">
        <div class="block text-center py-2 pb-1">
          <img :src="'/res/image/headline_blue.png'" class="w-32" />
        </div>
        <div>
          <div class="mt-3 w-full">
            <div class="border-b-2 border-[#F2F6F8] mb-1">
              <div class="flex justify-center">
                <div class="cal-col text-[#ff6666]">S</div>
                <div class="cal-col">M</div>
                <div class="cal-col">T</div>
                <div class="cal-col">W</div>
                <div class="cal-col">T</div>
                <div class="cal-col">F</div>
                <div class="cal-col text-[#0080ff]">S</div>
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

    <div class="p-4 text-center">
      이 사이트가 마음에 들지 않는 분은 <a class="animate-rainbow cursor-pointer" @click="openModal('recruit')">여기</a>를 누르세요
    </div>
  </div>

  <SidebarPanel
    :visible="sidebarOpen"
    @close="sidebarOpen = false"
    @open-record-history="openModal('recordHistory')"
  />

  <Toast position="bottom-right" />
  <ConfirmPopup />

  <Dialog v-model:visible="modals.notice.value" header="공지사항" modal :style="{ width: '90vw', maxWidth: '500px' }">
    <NoticeModal />
  </Dialog>
  <Dialog v-model:visible="modals.help.value" header="도움말" modal :style="{ width: '90vw', maxWidth: '500px' }">
    <HelpModal />
  </Dialog>
  <Dialog v-model:visible="modals.map.value" header="지도" modal :style="{ width: '96vw', maxWidth: '600px' }" @hide="resetGPS">
    <MapModal :visible="modals.map.value" />
  </Dialog>
  <Dialog v-model:visible="modals.recordHistory.value" header="급식 기록" modal :style="{ width: '90vw', maxWidth: '500px' }">
    <RecordHistoryModal />
  </Dialog>
  <Dialog v-model:visible="modals.recruit.value" header="개발자 구해요!" modal :style="{ width: '96vw', maxWidth: '600px' }">
    <RecruitModal />
  </Dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ConfirmPopup from 'primevue/confirmpopup'
import { useToast } from 'primevue/usetoast'
import { useCalendar } from './composables/useCalendar.js'
import { useRecords } from './composables/useRecords.js'
import { useAuth } from './composables/useAuth.js'
import { useWeather } from './composables/useWeather.js'
import { useMap } from './composables/useMap.js'
import { useModal } from './composables/useModal.js'
import { useNotice } from './composables/useNotice.js'
import Cookies from 'js-cookie'

import HeaderNav from './components/HeaderNav.vue'
import CalendarGrid from './components/CalendarGrid.vue'
import ContentArea from './components/ContentArea.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import NoticeModal from './components/modals/NoticeModal.vue'
import HelpModal from './components/modals/HelpModal.vue'
import MapModal from './components/modals/MapModal.vue'
import RecordHistoryModal from './components/modals/RecordHistoryModal.vue'
import RecruitModal from './components/modals/RecruitModal.vue'

const toast = useToast()
const { initCalendar, selectedDate, isSelectedActive } = useCalendar()
const { load, addRecord, deleteRecord } = useRecords(toast)
const { doAutoLogin, user } = useAuth(toast)
const { loadWeather } = useWeather()
const { resetGPS } = useMap()
const { modals, openModal, closeModal } = useModal()
const { noticeVersion, loadNotice } = useNotice()

const sidebarOpen = ref(false)

async function onAddRecord(course) {
  if (!isSelectedActive.value) return
  await addRecord({ date: selectedDate.value, course })
}

async function onDeleteRecord(target) {
  await deleteRecord(target)
}

onMounted(async () => {
  initCalendar()
  loadWeather()

  const loggedIn = await doAutoLogin()
  await load()

  if (loggedIn) {
    await loadNotice()
    if (user.value && noticeVersion.value && Cookies.get('versionInfo') !== noticeVersion.value) {
      Cookies.set('versionInfo', noticeVersion.value, { expires: 7 })
      openModal('notice')
    }
  } else {
    sidebarOpen.value = true
  }
})
</script>
