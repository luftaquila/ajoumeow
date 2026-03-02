<template>
  <span
    class="ripple inline-block w-16 h-8 leading-6 text-center rounded border border-solid text-white p-0.5 mx-1"
    :style="{ borderColor: bgColor, backgroundColor: bgColor, cursor: canDelete ? 'pointer' : 'default' }"
    @click="onClick($event)"
  >
    {{ name }}
  </span>
</template>

<script setup>
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps({
  name: String,
  id: [String, Number],
  course: [String, Number],
  bgColor: String,
  canDelete: Boolean,
})

const emit = defineEmits(['delete'])
const confirm = useConfirm()

function onClick(event) {
  if (!props.canDelete) return
  confirm.require({
    target: event.currentTarget,
    message: `${props.name} 삭제`,
    acceptLabel: '삭제',
    rejectLabel: '취소',
    accept: () => emit('delete'),
  })
}
</script>
