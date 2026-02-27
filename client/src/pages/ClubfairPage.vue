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
            <h1 class="text-3xl font-bold text-white sm:text-4xl">동아리 박람회</h1>
            <p class="mt-2 max-w-md text-sm text-gray-200 sm:text-base">
              미유미유가 참가하는 동아리 박람회 안내입니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">동아리 박람회란?</h2>
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
        아주대학교에서는 매 학기 초 동아리 박람회가 열립니다. 미유미유도 매 학기 박람회에 참가하여
        아주냥이들을 소개하고, 미유미유의 활동을 알리며, 굿즈 판매를 진행합니다.
      </p>
    </section>

    <!-- What we do -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-6 text-xl font-semibold text-gray-800">박람회에서 하는 일</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
            🐱
          </div>
          <h3 class="font-semibold text-gray-800">아주냥이 소개</h3>
          <p class="mt-2 text-sm text-gray-600">
            캠퍼스에서 생활하는 아주냥이들의 사진과 이야기를 소개합니다.
          </p>
        </div>
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
            🎨
          </div>
          <h3 class="font-semibold text-gray-800">굿즈 판매</h3>
          <p class="mt-2 text-sm text-gray-600">
            회원들이 직접 디자인한 아주냥이 굿즈를 판매합니다. 수익금은 전액 아주냥이들을 위해
            사용됩니다.
          </p>
        </div>
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-5">
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
            📋
          </div>
          <h3 class="font-semibold text-gray-800">신입 회원 모집</h3>
          <p class="mt-2 text-sm text-gray-600">
            미유미유에 관심 있는 학우분들의 가입 신청을 현장에서 받습니다.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="rounded-xl bg-primary-50 p-6 text-center sm:p-8">
      <h2 class="mb-3 text-xl font-semibold text-gray-800">미유미유에 관심이 있으신가요?</h2>
      <p class="mb-4 text-sm text-gray-600 sm:text-base">
        박람회를 놓치셨어도 걱정하지 마세요! 온라인으로도 가입 신청이 가능합니다.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <RouterLink
          to="/register"
          class="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          가입 신청하기
        </RouterLink>
        <RouterLink
          to="/goods"
          class="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          굿즈 보러가기
        </RouterLink>
      </div>
    </section>
  </div>
</template>
