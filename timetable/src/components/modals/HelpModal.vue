<template>
  <div class="text-sm text-text text-center">
    <a class="btn-blue" href="/guide"><i class="far fa-book-spells"></i>&ensp;급식 가이드 보기</a>
    <div class="my-3">날짜 위 점들은 <b>코스</b>와 <b>인원 수</b>를 나타내요.</div>
    <div class="hovered-example cal-item w-[54px] h-[54px] mx-auto my-3">
      <div class="rounded-full w-6 h-6 leading-[1.3rem] border-[0.1rem] border-[#34D399] text-center">5/12</div>
    </div>
    <div class="flex items-center justify-center gap-4 my-2">
      <span class="text-course1-text font-semibold">1코스</span>
      <span class="text-course2-text font-semibold">2코스</span>
      <span class="text-course3-text font-semibold">3코스</span>
    </div>
    <div class="text-text-secondary">
      <i class="far fa-circle"></i> <i class="far fa-equals"></i> <i class="fas fa-male"></i>&emsp;
      <i class="fas fa-circle"></i> <i class="far fa-equals"></i> <i class="fas fa-male"></i><i class="fas fa-male"></i><i class="fas fa-male"></i>
    </div>
    <div class="my-3 text-text-secondary">내가 신청한 날에는 날짜 주위에 <i class="far fa-circle text-[#34D399]"></i>가 나타나요.</div>
  </div>
  <div class="text-text text-left text-sm">
    <li class="font-bold mt-4">신청하기</li>
    <ol class="pl-4 text-text-secondary leading-relaxed">
      1. 원하는 날짜를 골라 <div class="text-center inline-block leading-4 bg-primary h-4 w-4 rounded-full text-white text-xs">+</div> 를 탭합니다.<br>
      2. 원하는 코스에 표시된 <span class="ripple inline-flex items-center justify-center w-8 h-4 rounded border-2 border-dashed border-text-muted/40 text-text-muted text-xs">+</span> 를 탭합니다.
    </ol>
    <li class="font-bold mt-4">삭제하기</li>
    <ol class="pl-4 text-text-secondary leading-relaxed">
      1. 삭제하고 싶은 이름표 <span class="ripple inline-flex items-center justify-center text-[0.5rem] h-4 px-1.5 rounded bg-course1-bg text-course1-text border border-course1/30 font-semibold">고양이</span> 를 탭합니다.<br>
      2. 삭제할 이름표를 다시 탭합니다.<br>
    </ol>
    <li class="font-bold mt-4">날씨</li>
    <ul class="pl-4 text-text-secondary text-xs leading-relaxed">
      오늘 날씨와 미세먼지는 실시간 아주대학교 데이터에요.<br>
      일주일 예보는 급식 권장 시간인 오후 6시의 예보에요.<br>
      날씨는 30분마다 업데이트됩니다.
    </ul>
  </div>
</template>

<style scoped>
.hovered-example {
  background: #EEF2FF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  background-image: url("data:image/svg+xml,%3Csvg width='54' height='54' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3Ccircle cx='18' cy='8' r='1.7' stroke='%23EF4444' stroke-width='1.3' fill='white'%3E%3C/circle%3E%3Ccircle cx='25' cy='8' r='1.7' stroke='%23F59E0B' stroke-width='1.3' fill='white'%3E%3C/circle%3E%3Ccircle cx='32' cy='8' r='1.7' stroke='%2310B981' stroke-width='1.3' fill='%2310B981'%3E%3C/circle%3E%3C/svg%3E") !important;
}
</style>
