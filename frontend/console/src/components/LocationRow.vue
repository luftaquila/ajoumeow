<template>
  <div class="flex flex-col gap-1">
    <div class="grid grid-cols-2 sm:grid-cols-[1fr_1fr_6.5rem_6.5rem_auto] gap-2 items-center">
      <InputText v-model="loc.name" placeholder="이름" size="small" :invalid="!!error && !loc.name?.trim()" />
      <InputText v-model="loc.detail" placeholder="상세 (예: 화단 옆)" size="small" />
      <InputText v-model="loc.lat" placeholder="위도" size="small" inputmode="decimal" :invalid="!isCoord(loc.lat)" />
      <InputText v-model="loc.lon" placeholder="경도" size="small" inputmode="decimal" :invalid="!isCoord(loc.lon)" />
      <div class="flex items-center gap-1 col-span-2 sm:col-span-1 justify-end">
        <a
          v-if="mapUrl"
          :href="mapUrl"
          target="_blank"
          rel="noopener"
          class="text-xs text-primary hover:underline whitespace-nowrap px-1"
          title="이 좌표를 지도에서 보기"
        >지도</a>
        <Button v-if="removable" icon="i-lucide-x" severity="danger" text size="small" title="위치 삭제" @click="$emit('remove')" />
      </div>
    </div>
    <small v-if="error" class="text-xs text-red-500">{{ error }}</small>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const props = defineProps({
  loc: { type: Object, required: true },
  error: { type: String, default: '' },
  removable: Boolean,
})
defineEmits(['remove'])

// Same rule as the settings page validation
const isCoord = v => /^-?\d{1,3}(\.\d+)?$/.test(String(v ?? '').trim())

const mapUrl = computed(() => {
  const lat = parseFloat(props.loc.lat)
  const lon = parseFloat(props.loc.lon)
  return Number.isFinite(lat) && Number.isFinite(lon) ? `https://www.google.com/maps?q=${lat},${lon}` : ''
})
</script>
