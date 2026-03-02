<template>
  <Dialog v-model:visible="modals.notice.value" header="공지사항" modal :style="{ width: '90vw', maxWidth: '500px' }">
    <NoticeModal />
  </Dialog>
  <Dialog v-model:visible="modals.help.value" header="도움말" modal :style="{ width: '90vw', maxWidth: '500px' }">
    <HelpModal />
  </Dialog>
  <Dialog v-model:visible="modals.map.value" header="지도" modal :style="{ width: '96vw', maxWidth: '600px' }" @hide="resetGPS">
    <MapModal :visible="modals.map.value" />
  </Dialog>
  <Dialog v-model:visible="modals.recruit.value" header="개발자 구해요!" modal :style="{ width: '96vw', maxWidth: '600px' }">
    <RecruitModal />
  </Dialog>
  <Dialog v-model:visible="modals.apply.value" header="회원 등록" modal :style="{ width: '96vw', maxWidth: '520px' }" @hide="onApplyClose">
    <ApplyModal />
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import { useModal } from '../composables/useModal.js'
import { useMap } from '../composables/useMap.js'
import NoticeModal from './modals/NoticeModal.vue'
import HelpModal from './modals/HelpModal.vue'
import MapModal from './modals/MapModal.vue'
import RecruitModal from './modals/RecruitModal.vue'
import ApplyModal from './modals/ApplyModal.vue'

const { modals } = useModal()
const { resetGPS } = useMap()

function onApplyClose() {
  // Reset is handled inside ApplyModal
}
</script>
