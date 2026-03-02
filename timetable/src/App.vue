<template>
  <div class="bg-surface-muted min-w-[320px] min-h-[568px] max-w-[414px] overflow-y-auto mx-auto md:shadow-[0_8px_40px_rgba(0,0,0,0.08)] md:my-6 md:rounded-2xl">
    <HeaderNav
      @open-notice="openModal('notice')"
      @open-help="openModal('help')"
      @open-map="openModal('map')"
      @open-sidebar="sidebarOpen = true"
    />

    <main class="flex flex-col gap-4 p-4">
      <CalendarSection />
      <ContentArea
        @add-record="onAddRecord"
        @delete-record="onDeleteRecord"
      />
    </main>

    <AppFooter />
  </div>

  <SidebarPanel
    :visible="sidebarOpen"
    @close="sidebarOpen = false"
    @open-record-history="openModal('recordHistory')"
  />

  <Toast position="bottom-right" />
  <ConfirmPopup />
  <ModalContainer />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Toast from 'primevue/toast'
import ConfirmPopup from 'primevue/confirmpopup'
import { useCalendar } from './composables/useCalendar.js'
import { useRecords } from './composables/useRecords.js'
import { useAuth } from './composables/useAuth.js'
import { useWeather } from './composables/useWeather.js'
import { useModal } from './composables/useModal.js'
import { useNotice } from './composables/useNotice.js'
import Cookies from 'js-cookie'

import HeaderNav from './components/HeaderNav.vue'
import CalendarSection from './components/CalendarSection.vue'
import ContentArea from './components/ContentArea.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import AppFooter from './components/AppFooter.vue'
import ModalContainer from './components/ModalContainer.vue'

const { initCalendar, selectedDate, isSelectedActive } = useCalendar()
const { load, addRecord, deleteRecord } = useRecords()
const { doAutoLogin, user } = useAuth()
const { loadWeather } = useWeather()
const { openModal } = useModal()
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
