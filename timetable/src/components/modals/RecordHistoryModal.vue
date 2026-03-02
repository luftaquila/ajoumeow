<template>
  <div class="text-[0.9rem] text-center">
    <DataTable v-if="rows.length" :value="rows" size="small">
      <Column field="index" header="순번" />
      <Column field="date" header="날짜" />
      <Column field="course" header="코스" />
      <Column field="score" header="점수" />
    </DataTable>
    <div v-else class="py-8 flex flex-col items-center gap-3">
      <div class="w-14 h-14 rounded-full bg-surface-muted flex items-center justify-center">
        <i class="far fa-clipboard-list text-xl text-text-muted"></i>
      </div>
      <div class="text-text-muted">기록이 없습니다.</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useAuth } from '../../composables/useAuth.js'
import { formatDate } from '../../utils/dateFormat.js'

const { statistics } = useAuth()

const rows = computed(() =>
  statistics.value.map((obj, i) => ({
    index: statistics.value.length - i,
    date: formatDate(new Date(obj.date), 'yyyy년 m월 d일'),
    course: obj.course,
    score: `${obj.score}점`,
  }))
)
</script>
