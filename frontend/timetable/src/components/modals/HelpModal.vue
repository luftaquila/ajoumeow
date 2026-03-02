<template>
  <div class="text-sm text-text text-center">
    <a class="btn-blue inline-flex items-center gap-1.5" href="/guide"><i class="i-lucide-book-open text-base"></i>&ensp;급식 가이드 보기</a>

    <div class="bg-surface-dim rounded-xl p-4 mt-4">
      <p class="mb-3">날짜 위 점들은 <b>코스</b>와 <b>인원 수</b>를 나타내요.</p>
      <div
        class="cal-item w-[54px] h-[54px] mx-auto my-3 bg-calendar-today shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
        :style="{ backgroundImage: exampleSvg }"
      >
        <div class="rounded-full w-5 h-5 flex items-center justify-center ring-1.5 ring-accent">5/12</div>
      </div>
      <div class="flex items-center justify-center gap-4 my-2">
        <span class="text-course1-text font-semibold">1코스</span>
        <span class="text-course2-text font-semibold">2코스</span>
        <span class="text-course3-text font-semibold">3코스</span>
      </div>
      <div class="flex items-center justify-center gap-4 mt-2 text-text-secondary">
        <span class="flex items-center gap-1"><i class="i-lucide-circle text-xs"></i> <i class="i-lucide-equal text-xs"></i> <i class="i-lucide-person-standing text-sm"></i></span>
        <span class="flex items-center gap-1"><i class="i-lucide-circle-dot text-xs"></i> <i class="i-lucide-equal text-xs"></i> <i class="i-lucide-person-standing text-sm"></i><i class="i-lucide-person-standing text-sm"></i><i class="i-lucide-person-standing text-sm"></i></span>
      </div>
      <p class="mt-3 text-text-secondary">내가 신청한 날에는 날짜 주위에 <i class="i-lucide-circle text-accent inline-block align-middle"></i>가 나타나요.</p>
    </div>
  </div>
  <div class="bg-surface-dim rounded-xl p-4 mt-3">
    <p class="font-bold text-sm text-text mb-2">날씨</p>
    <div class="text-text-secondary text-xs leading-relaxed">
      <p>오늘 날씨와 미세먼지는 실시간 아주대학교 데이터에요.</p>
      <p>일주일 예보는 급식 권장 시간인 오후 6시의 예보에요.</p>
      <p>날씨는 30분마다 업데이트됩니다.</p>
    </div>
  </div>
</template>

<script setup>
const exampleSvg = `url("data:image/svg+xml,%3Csvg width='54' height='54' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3Ccircle cx='18' cy='8' r='2.2' stroke='%23F43F5E' stroke-width='1.5' fill='transparent'%3E%3C/circle%3E%3Ccircle cx='25' cy='8' r='2.2' stroke='%233B82F6' stroke-width='1.5' fill='transparent'%3E%3C/circle%3E%3Ccircle cx='32' cy='8' r='2.2' stroke='%238B5CF6' stroke-width='1.5' fill='%238B5CF6'%3E%3C/circle%3E%3C/svg%3E")`
</script>
