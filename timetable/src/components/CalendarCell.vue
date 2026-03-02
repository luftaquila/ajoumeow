<template>
  <div
    class="cal-body-col"
    :class="{
      'cal-today': cell.isToday,
      'cal-selected': selected,
      'cal-inactive': cell.isInactive,
    }"
    :data-date="cell.date"
    @click="$emit('select')"
  >
    <div
      class="cal-item"
      :style="{ backgroundImage: cell.svgBackground }"
    >
      <div :class="{ 'rounded-full w-6 h-6 leading-[1.3rem] border-[0.1rem] border-[#90ee90] text-center': cell.hasMy }">
        {{ cell.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cell: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>

<style scoped>
.cal-today .cal-item {
  border-color: #FEFEFE;
  background-color: #F2F6F8;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
}
.cal-selected .cal-item {
  background-color: rgba(102, 220, 236, 0.8);
  border-color: #FEFEFE;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
}
.cal-inactive .cal-item {
  color: #DCDCE3;
  cursor: default;
}
.cal-inactive .cal-item:hover {
  background: transparent;
  box-shadow: none;
}
.cal-item:hover {
  background: #f8fafa;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
  transition: 0.2s all ease-in;
}
</style>
