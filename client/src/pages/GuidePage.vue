<script setup lang="ts">
import { ref } from 'vue';

const showVideo = ref(true);

const steps = [
  {
    title: '약속 잡기',
    icon: '🤝',
    content:
      '만약 나와 함께 신청한 다른 회원님이 계시다면 연락을 보내 시간을 맞춰 함께 급식하시면 됩니다. 급식 권장 시간은 오후 3시 ~ 오후 9시에요.',
  },
  {
    title: '동아리방',
    icon: '🏠',
    content:
      '급식에 필요한 물건들은 모두 동아리방에 있습니다. 동아리방은 신학생회관 406호에요! 신학생회관과 동방 출입문을 잠금 해제하려면 등록된 학생증이 필요합니다. 출입 권한 등록은 가입 후 최대 한 달 정도 소요됩니다.',
  },
  {
    title: '급식 준비',
    icon: '🛒',
    content: '',
    details: [
      '동방 앞 복도에 사물함이 있어요. 사물함 맨 위 칸에는 참치캔과 영양제 2종류, 중간 칸에는 젓가락이 있습니다.',
      '영양제를 각각 한 스푼씩 참치캔에 넣고 젓가락으로 잘 섞어 주세요.',
      '참치캔이 다 준비됐다면 사료통과 물통도 챙겨주세요! 사료통에 사료가 없다면 리빙박스에서 사료를 채워넣으면 됩니다.',
      '신학생회관 1층과 3층에 정수기가 있어요. 정수기에서 물통에 물을 채우면 준비 끝!',
    ],
  },
  {
    title: '급식하기',
    icon: '🐟',
    content:
      '준비가 끝났다면 신청한 코스를 따라 급식소를 찾아가세요. 각 급식소에 있는 사료그릇과 물그릇을 채워주시면 됩니다. 사료그릇에는 사료와 함께 캔도 적당히 나누어서 주면 돼요. 급식 인증을 위해서 사진 찍는 것도 잊지 마세요!',
  },
  {
    title: '급식 인증하기',
    icon: '📸',
    content:
      '급식이 끝나면 다 쓴 참치캔과 젓가락, 물통 속 물을 꼭 버려 주세요. 미유미유 급식인증방에 사진과 함께 급식 인증을 해 주시면 급식이 끝납니다.',
  },
];

const warnings = [
  '급식 인증은 반드시 활동 당일에 해 주셔야 해요. 깜빡하시면 안 돼요!',
  '급식 인증이 없는 경우 봉사시간이 부여되지 않으며 회칙에 따라 경고를 드릴 수 있습니다.',
  '당일에 갑자기 사정이 생겨 급식을 취소하실 때는 꼭 단톡방에서 대타를 구해 주세요!',
  '급식 권장 시간은 오후 6시에요. 이 시간에 급식이 어렵다면 정오 ~ 자정 사이에 급식을 해 주세요.',
];
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
            <h1 class="text-3xl font-bold text-white sm:text-4xl">활동 가이드</h1>
            <p class="mt-2 max-w-md text-sm text-gray-200 sm:text-base">
              신입 집사님을 위한 급식 활동 가이드입니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Why feeding -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">왜 급식을 하나요?</h2>
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
        캠퍼스에서 생활하는 고양이들은 식량을 사람이 먹고 버린 음식물 쓰레기에서밖에 조달할 수
        없습니다. 이로 인해 쓰레기통을 헤집는 사례가 빈번하게 발생하곤 합니다. 이는 사람들에게
        불편을 줄 뿐만 아니라 고양이의 건강에도 악영향을 끼칩니다. 미유미유는 적절한 먹이를
        제공함으로써 이러한 현상을 사전에 예방하고 있습니다. 또한 중성화 수술 후 방사된 고양이가
        자신의 영역을 지키도록 관리하기 위함이기도 합니다.
      </p>
    </section>

    <!-- Feeding Application -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">급식 신청</h2>
      <p class="mb-4 text-sm leading-relaxed text-gray-700 sm:text-base">
        미유미유는 급식표 페이지를 통해 활동 신청을 받고 일정을 관리합니다.
      </p>
      <RouterLink
        to="/timetable"
        class="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
      >
        급식표 바로가기
      </RouterLink>
    </section>

    <!-- Feeding Steps -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-6 text-xl font-semibold text-gray-800">급식 방법</h2>
      <div class="space-y-6">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="rounded-lg border border-gray-100 bg-gray-50 p-5"
        >
          <div class="mb-3 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xl">
              {{ step.icon }}
            </span>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ index + 1 }}. {{ step.title }}
            </h3>
          </div>
          <p v-if="step.content" class="text-sm leading-relaxed text-gray-700 sm:text-base">
            {{ step.content }}
          </p>
          <ul v-if="step.details" class="space-y-2">
            <li
              v-for="(detail, i) in step.details"
              :key="i"
              class="flex gap-2 text-sm leading-relaxed text-gray-700 sm:text-base"
            >
              <span class="mt-1 text-primary-500">&#8226;</span>
              <span>{{ detail }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Guide Video -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800">급식 준비 가이드 영상</h2>
        <button
          class="text-sm text-primary-500 hover:text-primary-600"
          @click="showVideo = !showVideo"
        >
          {{ showVideo ? '접기' : '보기' }}
        </button>
      </div>
      <div v-if="showVideo">
        <video
          controls
          class="w-full rounded-lg"
          poster="/videos/stepbystep.png"
        >
          <source src="/videos/stepbystep_guide.mp4" type="video/mp4" />
          브라우저에서 비디오 재생을 지원하지 않습니다.
        </video>
      </div>
    </section>

    <!-- Warnings -->
    <section class="rounded-xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-amber-800">주의사항</h2>
      <ul class="space-y-3">
        <li
          v-for="(warning, index) in warnings"
          :key="index"
          class="flex gap-3 text-sm leading-relaxed text-amber-700 sm:text-base"
        >
          <span class="mt-0.5 shrink-0">&#9888;&#65039;</span>
          <span>{{ warning }}</span>
        </li>
      </ul>
    </section>

    <!-- Feeding Course -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 class="mb-4 text-xl font-semibold text-gray-800">급식 코스</h2>
      <p class="text-sm text-gray-600 sm:text-base">
        급식 코스는 급식표 사이트에서 로그인한 사용자에게만 표시됩니다.
      </p>
      <RouterLink
        to="/timetable"
        class="mt-3 inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
      >
        급식표에서 확인하기 &rarr;
      </RouterLink>
    </section>
  </div>
</template>
