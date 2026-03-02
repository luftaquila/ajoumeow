<template>
  <div style="font-size: 1rem; color: #333; text-align: center">
    <a class="btn blue" href="/guide"><i class="far fa-book-spells"></i>&ensp;급식 가이드 보기</a>
    <div style="margin: 0.5rem 0;">날짜 위 점들은 <b>코스</b>와 <b>인원 수</b>를 나타내요.</div>
    <div class="calendar-table__item hovered">
      <div class="my">5/12</div>
    </div>
    <div>
      <span style="color: red">1코스</span>&emsp;
      <span style="color: gold">2코스</span>&emsp;
      <span style="color: limegreen">3코스</span>
    </div>
    <div>
      <i class="far fa-circle"></i> <i class="far fa-equals"></i> <i class="fas fa-male"></i>&emsp;
      <i class="fas fa-circle"></i> <i class="far fa-equals"></i> <i class="fas fa-male"></i><i class="fas fa-male"></i><i class="fas fa-male"></i>
    </div>
    <div style="margin: 0.5rem 0;">내가 신청한 날에는 날짜 주위에 <i class="far fa-circle" style="color: lightgreen"></i>가 나타나요.</div>
  </div>
  <div style="color: #333; text-align: left">
    <li style="font-weight: bold; margin-top: 1rem;">신청하기</li>
    <ol style="padding-left: 1rem">
      1. 원하는 날짜를 골라 <div style="text-align: center; display: inline-block; line-height: 1rem; background-color: rgb(33, 150, 243); height: 1rem; width: 1rem; border-radius: 50%; color: white">+</div> 를 탭합니다.<br>
      2. 원하는 코스에 표시된 <span class="ripple" style="display: inline-block; width: 2rem; height: 1rem; line-height: 0.9rem; text-align: center; border-radius: 3px; border: dashed 1px gray; color: gray;">+</span> 를 탭합니다.
    </ol>
    <li style="font-weight: bold; margin-top: 1rem;">삭제하기</li>
    <ol style="padding-left: 1rem">
      1. 삭제하고 싶은 이름표 <span class="ripple namecard example" style="display: inline-block; font-size: 0.5rem; width: 2rem; height: 1rem; line-height: 0.9rem; text-align: center; border-radius: 3px; border: solid 1px lightcoral; background-color: lightcoral; color: white;">고양이</span> 를 탭합니다.<br>
      2. 삭제할 이름표를 다시 탭합니다.<br>
    </ol>
    <li style="font-weight: bold; margin-top: 1rem;">날씨</li>
    <ul style="padding-left: 1rem; font-size: 0.8rem">
      오늘 날씨와 미세먼지는 실시간 아주대학교 데이터에요.<br>
      일주일 예보는 급식 권장 시간인 오후 6시의 예보에요.<br>
      날씨는 30분마다 업데이트됩니다.
    </ul>
  </div>
</template>
