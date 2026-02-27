<script setup lang="ts">
const constitutionUrl =
  'https://docs.google.com/document/d/1KgLyfhdYDRHL2Pn3nFIYBT9_RbMiUuDipNl7-HVFdvs/';
const constitutionEmbedUrl =
  'https://docs.google.com/document/d/e/2PACX-1vTX7GjwNhp_nR9zL9gEcCijkInl-DU-ZJ4ASdL3kmZIwEnjaSJwk7tpC4XnAXtd5ea6f-46--L_8eZN/pub?embedded=true';
const constitutionPdfUrl =
  'https://docs.google.com/document/d/1KgLyfhdYDRHL2Pn3nFIYBT9_RbMiUuDipNl7-HVFdvs/export?format=pdf';
</script>

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
            <h1 class="text-3xl font-bold text-white sm:text-4xl">신입 집사 안내</h1>
            <p class="mt-2 max-w-md text-sm text-gray-200 sm:text-base">
              사람과 동물의 공존을 꿈꾸는 중앙동아리 미유미유입니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Introduction -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">환영합니다!</h2>
      <div class="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base">
        <p>
          안녕하세요, 미유미유입니다!<br />
          먼저 미유미유에 관심을 가지고 가입을 신청해주신 학우 여러분께 감사의 말씀을 드립니다.
        </p>
        <p>
          활동을 시작하기에 앞서,
          <strong>동아리 회비를 납부해 주셔야 회원으로 등록</strong>되신다는 것을 알려드립니다.<br />
          납부해주신 회비의 사용처는 아래 이미지를 참고해 주세요!
        </p>
      </div>
    </section>

    <!-- Fee usage infographic -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">회비 사용처</h2>
      <img
        src="/images/fee-usage.png"
        alt="회비 사용처 안내"
        class="w-full rounded-lg"
      />
      <p class="mt-4 text-sm leading-relaxed text-gray-700 sm:text-base">
        입금이 확인되면 미유미유 단톡방에 초대해 드리며, 정식으로 미유미유에서 활동하시게 됩니다.
      </p>
    </section>

    <!-- Constitution -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">동아리 회칙</h2>
      <p class="mb-4 text-sm leading-relaxed text-gray-700 sm:text-base">
        원활한 동아리 활동을 위해 회칙을 아래에 첨부해 드리니, 꼭 읽어주시면 감사하겠습니다.
        궁금한 점이 있다면 언제든지 운영진에게 편하게 말씀해 주세요.
      </p>
      <div class="mb-4 flex flex-wrap gap-3">
        <a
          :href="constitutionUrl"
          target="_blank"
          rel="noopener"
          class="inline-block rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          새 창에서 열기
        </a>
        <a
          :href="constitutionPdfUrl"
          target="_blank"
          rel="noopener"
          class="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          PDF 다운로드
        </a>
      </div>
      <iframe
        :src="constitutionEmbedUrl"
        class="h-[70vh] w-full rounded-lg border border-gray-200"
        title="미유미유 회칙"
      />
    </section>

    <!-- Social Links -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">연락처</h2>
      <div class="flex flex-wrap gap-3">
        <a
          href="https://www.instagram.com/ajou.meyoumeow/"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Instagram
        </a>
        <a
          href="https://www.facebook.com/meyoumeow/"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Facebook
        </a>
        <a
          href="https://pf.kakao.com/_xjNAJb"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-900 transition-opacity hover:opacity-90"
        >
          KakaoTalk
        </a>
      </div>
    </section>
  </div>
</template>
