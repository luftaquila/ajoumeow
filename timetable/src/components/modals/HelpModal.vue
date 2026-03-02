<template>
  <div class="text-base text-[#333] text-center">
    <a class="btn-blue" href="/guide"><i class="far fa-book-spells"></i>&ensp;급식 가이드 보기</a>
    <div class="my-2">날짜 위 점들은 <b>코스</b>와 <b>인원 수</b>를 나타내요.</div>
    <div class="hovered-example cal-item w-[54px] h-[54px] mx-auto my-2">
      <div class="rounded-full w-6 h-6 leading-[1.3rem] border-[0.1rem] border-[#90ee90] text-center">5/12</div>
    </div>
    <div>
      <span class="text-red">1코스</span>&emsp;
      <span class="text-[gold]">2코스</span>&emsp;
      <span class="text-[limegreen]">3코스</span>
    </div>
    <div>
      <i class="far fa-circle"></i> <i class="far fa-equals"></i> <i class="fas fa-male"></i>&emsp;
      <i class="fas fa-circle"></i> <i class="far fa-equals"></i> <i class="fas fa-male"></i><i class="fas fa-male"></i><i class="fas fa-male"></i>
    </div>
    <div class="my-2">내가 신청한 날에는 날짜 주위에 <i class="far fa-circle text-[lightgreen]"></i>가 나타나요.</div>
  </div>
  <div class="text-[#333] text-left">
    <li class="font-bold mt-4">신청하기</li>
    <ol class="pl-4">
      1. 원하는 날짜를 골라 <div class="text-center inline-block leading-4 bg-primary h-4 w-4 rounded-full text-white">+</div> 를 탭합니다.<br>
      2. 원하는 코스에 표시된 <span class="ripple inline-block w-8 h-4 leading-[0.9rem] text-center rounded border border-dashed border-gray text-gray">+</span> 를 탭합니다.
    </ol>
    <li class="font-bold mt-4">삭제하기</li>
    <ol class="pl-4">
      1. 삭제하고 싶은 이름표 <span class="ripple inline-block text-[0.5rem] w-8 h-4 leading-[0.9rem] text-center rounded border border-solid border-[lightcoral] bg-[lightcoral] text-white">고양이</span> 를 탭합니다.<br>
      2. 삭제할 이름표를 다시 탭합니다.<br>
    </ol>
    <li class="font-bold mt-4">날씨</li>
    <ul class="pl-4 text-sm">
      오늘 날씨와 미세먼지는 실시간 아주대학교 데이터에요.<br>
      일주일 예보는 급식 권장 시간인 오후 6시의 예보에요.<br>
      날씨는 30분마다 업데이트됩니다.
    </ul>
  </div>
</template>

<style scoped>
.hovered-example {
  background: #f8fafa;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
  background-image: url("data:image/svg+xml,%3Csvg width='54' height='54' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E%3Ccircle cx='18' cy='8' r='1.7' stroke='red' stroke-width='1.3' fill='white'%3E%3C/circle%3E%3Ccircle cx='25' cy='8' r='1.7' stroke='gold' stroke-width='1.3' fill='white'%3E%3C/circle%3E%3Ccircle cx='32' cy='8' r='1.7' stroke='limegreen' stroke-width='1.3' fill='limegreen'%3E%3C/circle%3E%3C/svg%3E") !important;
}
</style>
