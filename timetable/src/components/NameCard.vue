<template>
  <span
    class="ripple inline-flex items-center justify-center h-7 px-3 rounded-lg text-xs font-semibold border transition-all duration-200"
    :class="[
      `bg-course${course}-bg`,
      `text-course${course}-text`,
      `border-course${course}/30`,
      canDelete ? 'cursor-pointer hover:shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'cursor-default',
    ]"
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
