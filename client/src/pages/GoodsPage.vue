<script setup lang="ts">
import { ref } from 'vue';

interface GoodsItem {
  name: string;
  price: string;
  year: string;
  spec: string;
  description: string;
  designer?: string;
  image: string;
}

const goods: GoodsItem[] = [
  {
    name: '인냥상 금속뱃지',
    price: '₩6,000',
    year: '2022년',
    spec: '25mm*25mm / 부분 펄 채색의 금속',
    description:
      '아주냥이!! 완전 그 자체예요! 우리 학교의 사랑스런 고양이 삐약이를 모델로 했어요. \'밤하늘에 펄~\' 채색으로 퀄리티를 높이되, 부담스럽지 않은 크기로 만들었으니 여기저기 붙여놓고 자랑할 일만 남았어요!',
    designer: '김수진',
    image: '/images/goods/인냥상뱃지.jpg',
  },
  {
    name: '미유미유 명작 컬렉숀',
    price: '₩1,000',
    year: '2022년',
    spec: '150mm*100mm / 아르떼지',
    description:
      '동화와 아주냥이들의 귀여운 만남! 아주냥이들이 동화 속에서 튀어나왔어요! 돼지고양이 3형제와 금참치은참치 두 장으로 구성되어 있어요. 앞면은 귀여운 컬러 삽화가, 뒷면엔 조그마한 비하인드가 있답니다!',
    designer: '오다인',
    image: '/images/goods/명작컬렉숀엽서.jpg',
  },
  {
    name: '바글바글 안경닦이',
    price: '₩3,000',
    year: '2022년',
    spec: '180mm*190mm / 극세사 천',
    description:
      '아주대에 살고 있는 아주냥이들이 안경닦이 속으로! 극세사 재질과 넉넉한 크기의 가성비 안경닦이입니다. 귀여운 아주냥이들이 여러분의 안경, 액정 등을 그루밍 해드립니다! 아주냥이 여기 다 모였네!',
    designer: '오다인',
    image: '/images/goods/바글바글안경닦이.jpg',
  },
  {
    name: '삐목치의 우주정복 안경닦이',
    price: '₩3,000',
    year: '2022년',
    spec: '180*190mm / 극세사 천',
    description:
      '아주대의 인싸, 치명적인 귀여움으로 우주까지 정복하다!! 안경닦이 속으로 들어가 세계 정복을 꿈꾸던 아주대의 인싸 삐목치. 우주최강 귀여운 매력으로 모든 것을 빛나게 하기 위해 세계를 넘어 우주까지 진출했다는데...?!',
    designer: '서지혜',
    image: '/images/goods/우주정복안경닦이.jpg',
  },
  {
    name: '2022 미니 캣-린더',
    price: '₩2,000',
    year: '2022년',
    spec: '50*90mm',
    description:
      '앞면에는 아주냥이들과 달마다 피어나는 꽃의 일러스트 콜라보를, 뒷면에는 털 한 올 한 올이 살아있는 고화질 사진이 있는 냥꽃달력',
    designer: '윤예지',
    image: '/images/goods/미니캣린더.gif',
  },
  {
    name: '야옹아 대학가자 노트',
    price: '₩4,000',
    year: '2021년',
    spec: '190*260mm / 100페이지',
    description:
      '고양이가 20년 넘게 사는 건 매우 드문 일이에요. 아주냥이들이 대학에 갈 만큼 오래오래 건강하고 행복했으면 좋겠다는 마음을 담아 만들었어요. 표지를 넘기면 아주냥이들의 이름이 함께 적혀 있답니다. 두툼한 내지와 방수 처리된 표지로 고급스럽게 만들었어요.',
    designer: '김수진',
    image: '/images/goods/야옹아대학가자노트.jpg',
  },
  {
    name: '도서관 3총사! 삐목치 스티커',
    price: '₩500 (세트)',
    year: '2021년',
    spec: '115*115mm / 무광 아트지',
    description:
      '학교의 대표 귀염둥이들인 도서관 3총사 삐목치(삐약이, 목주, 학치)의 일상을 담은 일러스트 스티커입니다. 칼선이 없어 원하는 모양으로 마음껏 잘라 사용하실 수 있습니다.',
    designer: '루토즈',
    image: '/images/goods/삐목치스티커.jpg',
  },
  {
    name: '통째로 봐야 귀여워 아주냥이 스티커',
    price: '₩500 (세트)',
    year: '2021년',
    spec: '115*115mm / 무광 아트지',
    description:
      '아주냥이들을 통째로 볼 수 있는 귀여운 일러스트를 담은 스티커입니다. 칼선이 없어 원하는 모양으로 마음껏 잘라 사용하실 수 있습니다.',
    designer: '오다인',
    image: '/images/goods/아주냥이스티커.jpg',
  },
  {
    name: '크게 봐야 귀여워 스티커',
    price: '₩1,000',
    year: '2021년',
    spec: '118*118mm / 무광 아트지',
    description:
      '아주냥이들의 얼굴을 더욱 크게 볼 수 있는 귀여운 일러스트 스티커입니다. 원형 칼선이 들어가있어, 손쉽게 노트북이나 공책 등 다양한 곳에 붙여 사용하실 수 있습니다 :)',
    designer: '강다경',
    image: '/images/goods/크게봐야귀여워스티커.jpg',
  },
  {
    name: '목주 그립톡',
    price: '₩7,000',
    year: '2021년',
    spec: '40*40*12mm / 투명 아크릴',
    description:
      '항상 피곤한 목주의 숨겨진 땡그란 눈을 볼 수 있는 그립톡입니다. 투명 아크릴로 제작되어서 어떤 케이스와도 찰떡궁합이에요! 3단으로 접혔다 펼쳐지며 접착력이 우수합니다.',
    designer: '조민종',
    image: '/images/goods/목주그립톡.jpg',
  },
  {
    name: '삼냥 그립톡',
    price: '₩5,000',
    year: '2021년',
    spec: '40*23*7.3mm / 플라스틱',
    description:
      '시험기간 지친 마음을 치료해주는 도서관 앞 삼냥이들이 둥글게 모여서 쉬고 있는 모습입니다. 3단으로 접혔다 펼쳐지며 접착력이 우수합니다. 무광 UV 코팅이 적용되어 있습니다.',
    designer: '조민종',
    image: '/images/goods/삼냥그립톡.jpg',
  },
  {
    name: '미유미유 돕바',
    price: '₩65,800',
    year: '2020년',
    spec: '',
    description:
      '복실복실한 털이 없는 인간들을 위한 겨울나기용 돕바에요. 앞면에는 고양이 발바닥이, 팔에는 고양이와 사람을 형상화한 자수가 있습니다. 흰색에 금색 자수, 검은색에 흰색 자수의 두 가지 버전이 있어요.',
    image: '/images/goods/미유미유돕바.jpg',
  },
  {
    name: '손거울',
    price: '₩2,000',
    year: '2019년',
    spec: '',
    description: '거울아 거울아 세상에 누가 재일 이뿌니 차밍이가 재일 이쁘다',
    designer: '이채린, 차지민',
    image: '/images/goods/손거울.jpg',
  },
  {
    name: '고양이 안경닦이',
    price: '₩3,000',
    year: '2019년',
    spec: '',
    description:
      '기엽꾸 깜찌칸 아주냥이가 스물세마리나 이써오 안경닦이 한 장 사면 아주냥이 다 봐따',
    designer: '차지민',
    image: '/images/goods/안경닦이.jpg',
  },
  {
    name: '원형 스티커',
    price: '₩2,000',
    year: '2019년',
    spec: '',
    description:
      '부스에 오면 고등어가 이꼬 차밍이가 잇고 순이가 잇꼬 깡이가 이꼬 코블이가 잇고 루돌이도 이써오',
    designer: '차지민',
    image: '/images/goods/원형스티커.jpg',
  },
];

const selectedItem = ref<GoodsItem | null>(null);

function openDetail(item: GoodsItem) {
  selectedItem.value = item;
}

function closeDetail() {
  selectedItem.value = null;
}
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
            <h1 class="text-3xl font-bold text-white sm:text-4xl">굿즈 카탈로그</h1>
            <p class="mt-2 max-w-md text-sm text-gray-200 sm:text-base">
              사람과 동물의 공존을 꿈꾸는 아주대학교 미유미유입니다.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Introduction -->
    <section class="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <p class="text-sm leading-relaxed text-gray-700 sm:text-base">
        아주냥이들을 모티브로 미유미유 회원들이 직접 디자인한 굿즈를 소개합니다.<br />
        판매 수익금은 전액 아주냥이들을 위한 사료 구매와 병원비 등에 사용되며, 투명하게 공개하고
        있습니다.
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
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

    <!-- Goods Grid -->
    <section>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in goods"
          :key="item.name"
          class="cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
          @click="openDetail(item)"
        >
          <div class="aspect-square overflow-hidden bg-gray-100">
            <img
              :src="item.image"
              :alt="item.name"
              class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-800">{{ item.name }}</h3>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-lg font-bold text-primary-600">{{ item.price }}</span>
              <span class="text-xs text-gray-400">{{ item.year }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Copyright -->
    <p class="text-center text-xs text-gray-400">
      굿즈에 대한 모든 저작권은 미유미유에 있습니다.<br />
      굿즈 이미지와 디자인에 대한 무단 복제, 모방, 배포를 금합니다.
    </p>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedItem"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeDetail"
      >
        <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
          <div class="relative">
            <img
              :src="selectedItem.image"
              :alt="selectedItem.name"
              class="w-full"
            />
            <button
              class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              @click="closeDetail"
            >
              &times;
            </button>
          </div>
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-900">{{ selectedItem.name }}</h3>
            <div class="mt-2 flex items-center gap-3">
              <span class="text-2xl font-bold text-primary-600">{{ selectedItem.price }}</span>
              <span class="text-sm text-gray-400">{{ selectedItem.year }}</span>
            </div>
            <p v-if="selectedItem.spec" class="mt-1 text-sm text-gray-500">
              {{ selectedItem.spec }}
            </p>
            <p class="mt-4 text-sm leading-relaxed text-gray-700">
              {{ selectedItem.description }}
            </p>
            <p v-if="selectedItem.designer" class="mt-3 text-sm text-gray-400">
              Designed by {{ selectedItem.designer }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
