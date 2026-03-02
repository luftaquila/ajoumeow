<template>
  <div style="font-size: 0.9rem; text-align: center">
    <table v-if="statistics.length" cellspacing="10px">
      <tr><th>순번</th><th>날짜</th><th>코스</th><th>점수</th></tr>
      <tr v-for="(obj, i) in statistics" :key="i">
        <td>{{ statistics.length - i }}</td>
        <td>{{ formatDate(new Date(obj.date), 'yyyy년 m월 d일') }}</td>
        <td>{{ obj.course }}</td>
        <td>{{ obj.score }}점</td>
      </tr>
    </table>
    <div v-else style="color: #bbb; padding: 2rem 0;">기록이 없습니다.</div>
  </div>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth.js'
import { formatDate } from '../../utils/dateFormat.js'

const { statistics } = useAuth()
</script>
