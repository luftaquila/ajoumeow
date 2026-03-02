<template>
  <span
    class="inline-flex items-center justify-center h-8 px-3.5 rounded-xl text-xs font-semibold border"
    :class="[
      `bg-course${course}-bg`,
      'text-text',
      `border-course${course}/30`,
      canDelete ? 'cursor-pointer active:scale-95' : 'cursor-default',
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
    acceptProps: { severity: 'danger', size: 'small' },
    rejectProps: { severity: 'secondary', size: 'small', outlined: true },
    accept: () => emit('delete'),
  })
}
</script>
