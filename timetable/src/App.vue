<template>
  <div class="bg-surface-muted min-w-[320px] min-h-[568px] max-w-[430px] overflow-y-auto mx-auto md:shadow-elevated md:my-8 md:rounded-3xl">
    <HeaderNav
      @open-notice="openModal('notice')"
      @open-help="openModal('help')"
      @open-map="openModal('map')"
      @open-sidebar="sidebarOpen = true"
    />

    <main class="flex flex-col gap-5 p-4 pt-5">
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
