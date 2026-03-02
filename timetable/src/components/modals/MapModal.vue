<template>
  <div style="text-align: center;">
    <div style="font-size: 0.8rem; margin-top: 1rem">
      지도에 표시된 급식소는 실제 위치와 오차가 거의 없습니다.<br>
      급식소가 안 보인다면 내 위치를 정확히 맞춰 보세요!<br>
      급식소 핀을 클릭하면 사진이 나옵니다.<br>
      지도는 로그인한 사용자에게만 표시됩니다.
    </div>
    <div ref="mapContainer" id="map" style="margin-top: 1rem; height: 400px; width: 100%;"></div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useMap } from '../../composables/useMap.js'
import { useAuth } from '../../composables/useAuth.js'

const props = defineProps({ visible: Boolean })
const mapContainer = ref(null)
const { loadMap } = useMap()
const { isLoggedIn } = useAuth()

watch(() => props.visible, async (val) => {
  if (val && isLoggedIn.value) {
    await nextTick()
    if (mapContainer.value) {
      loadMap(mapContainer.value)
    }
  }
})
</script>
