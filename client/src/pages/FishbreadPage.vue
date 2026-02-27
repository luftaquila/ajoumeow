<template>
  <div class="space-y-8">
    <!-- Banner -->
    <section class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="relative h-48 sm:h-64">
        <img
          src="/images/banner.jpg"
          alt="미유미유 배너"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 to-transparent">
          <div class="px-6 sm:px-10">
            <h1 class="text-3xl font-bold text-white sm:text-4xl">붕어빵 가이드</h1>
            <p class="mt-2 max-w-md text-sm text-gray-200 sm:text-base">
              미유미유 붕어빵 나눔 활동 안내입니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">붕어빵 나눔이란?</h2>
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
        미유미유에서는 겨울철 붕어빵 나눔 행사를 진행합니다. 따뜻한 붕어빵을 학우들에게 나누어
        드리며, 수익금은 전액 아주냥이들을 위한 사료 구매와 의료비에 사용됩니다.
      </p>
    </section>

    <!-- Steps -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-6 text-xl font-semibold text-gray-800">진행 방법</h2>
      <div class="space-y-4">
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div class="mb-3 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
              📍
            </span>
            <h3 class="text-lg font-semibold text-gray-800">장소 및 시간</h3>
          </div>
          <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
            겨울철 캠퍼스 내 지정 장소에서 진행됩니다. 정확한 일시와 장소는 공지사항을 통해
            안내됩니다.
          </p>
        </div>
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div class="mb-3 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
              🐟
            </span>
            <h3 class="text-lg font-semibold text-gray-800">붕어빵 굽기</h3>
          </div>
          <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
            미유미유 회원들이 직접 붕어빵을 구워서 학우들에게 나눠드립니다. 팥과 슈크림 등 다양한
            맛을 준비합니다.
          </p>
        </div>
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div class="mb-3 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
              💰
            </span>
            <h3 class="text-lg font-semibold text-gray-800">수익금 사용</h3>
          </div>
          <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
            붕어빵 판매 수익금은 전액 아주냥이들을 위한 사료 구매와 병원비 등에 사용되며, 투명하게
            공개됩니다.
          </p>
        </div>
      </div>
    </section>

    <!-- Note -->
    <section class="rounded-xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
      <h2 class="mb-3 text-lg font-semibold text-blue-800">참여하고 싶으신가요?</h2>
      <p class="text-sm leading-relaxed text-blue-700 sm:text-base">
        붕어빵 나눔 행사 일정은 홈페이지 공지사항과 미유미유 공식 SNS를 통해 안내됩니다.
        미유미유 회원이라면 누구나 봉사자로 참여할 수 있습니다!
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        <RouterLink
          to="/"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          공지사항 확인
        </RouterLink>
        <RouterLink
          to="/register"
          class="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
        >
          가입 신청하기
        </RouterLink>
      </div>
    </section>
  </div>
</template>
