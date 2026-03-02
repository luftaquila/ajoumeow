<template>
  <span
    class="ripple namecard"
    :class="{ deleteActive: deleteConfirm }"
    :style="{
      display: 'inline-block',
      width: deleteConfirm ? '5rem' : '4rem',
      height: '2rem',
      lineHeight: '1.5rem',
      textAlign: 'center',
      borderRadius: '3px',
      border: `solid 1px ${bgColor}`,
      backgroundColor: bgColor,
      color: 'white',
      padding: '0.2rem',
      margin: '0 .3rem',
      cursor: canDelete ? 'pointer' : 'default',
    }"
    @click="onClick"
  >
    {{ name }}
  </span>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  name: String,
  id: [String, Number],
  course: [String, Number],
  bgColor: String,
  canDelete: Boolean,
})

const emit = defineEmits(['delete'])
const deleteConfirm = ref(false)

function onClick() {
  if (!props.canDelete) return
  if (deleteConfirm.value) {
    emit('delete')
    deleteConfirm.value = false
  } else {
    deleteConfirm.value = true
    setTimeout(() => { deleteConfirm.value = false }, 3000)
  }
}
</script>
