<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/utils/api';
import { useSettingsStore } from '@/stores/settings';
import { useAuthStore } from '@/stores/auth';

interface WeatherData {
  current: {
    weather: string;
    temp: number;
    tempSense: number;
    icon: string;
    dust: {
      pm10: string;
      pm25: string;
    };
  };
  forecast: Array<{
    date: string;
    weather: string;
    temp: number;
    icon: string;
  }>;
  update: string;
}

interface RecordItem {
  id: number;
  memberId: number;
  date: string;
  course: string;
  createdAt: string;
  memberName: string;
}

const settings = useSettingsStore();
const auth = useAuthStore();

const weather = ref<WeatherData | null>(null);
const weatherLoading = ref(true);
const todayRecords = ref<RecordItem[]>([]);
const recordsLoading = ref(true);

const today = computed(() => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
});

const recordsByCourse = computed(() => {
  const grouped: Record<string, RecordItem[]> = {};
  for (const record of todayRecords.value) {
    if (!grouped[record.course]) {
      grouped[record.course] = [];
    }
    grouped[record.course].push(record);
  }
  return grouped;
});

const courseColors: Record<string, string> = {
  '1코스': 'bg-blue-100 text-blue-800',
  '2코스': 'bg-green-100 text-green-800',
  '3코스': 'bg-purple-100 text-purple-800',
};

function getDustLevel(value: string): { label: string; color: string } {
  const num = parseInt(value, 10);
  if (isNaN(num)) return { label: value, color: 'text-gray-500' };
  if (num <= 30) return { label: '좋음', color: 'text-blue-500' };
  if (num <= 80) return { label: '보통', color: 'text-green-500' };
  if (num <= 150) return { label: '나쁨', color: 'text-orange-500' };
  return { label: '매우나쁨', color: 'text-red-500' };
}

function getWeatherIconUrl(icon: string): string {
  return `/images/weather/${icon}.png`;
}

async function fetchWeather() {
  try {
    const { data } = await api.get('/weather');
    weather.value = data;
  } catch {
    weather.value = null;
  } finally {
    weatherLoading.value = false;
  }
}

async function fetchTodayRecords() {
  try {
    const { data } = await api.get('/records', {
      params: { from: today.value, to: today.value },
    });
    todayRecords.value = data;
  } catch {
    todayRecords.value = [];
  } finally {
    recordsLoading.value = false;
  }
}

onMounted(() => {
  settings.fetchAnnouncement();
  fetchWeather();
  fetchTodayRecords();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Hero / Club Introduction -->
    <section class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="relative h-48 sm:h-64 md:h-80">
        <img
          src="/images/banner.jpg"
          alt="아주냥 배너"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 to-transparent"
        >
          <div class="px-6 sm:px-10">
            <h1 class="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              아주냥
            </h1>
            <p class="mt-2 max-w-md text-sm text-gray-200 sm:text-base">
              사람과 동물의 공존을 꿈꾸는 아주대학교 길고양이 돌봄 동아리
            </p>
            <div class="mt-4 flex gap-3">
              <RouterLink
                to="/register"
                class="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                가입 신청
              </RouterLink>
              <RouterLink
                to="/timetable"
                class="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-white"
              >
                급식표 보기
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Info Cards Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Weather Card -->
      <section class="rounded-xl bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">현재 날씨</h2>
        <div v-if="weatherLoading" class="flex items-center justify-center py-6">
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
          />
        </div>
        <div v-else-if="weather" class="space-y-4">
          <div class="flex items-center gap-4">
            <img
              :src="getWeatherIconUrl(weather.current.icon)"
              :alt="weather.current.weather"
              class="h-14 w-14"
            />
            <div>
              <div class="text-3xl font-bold text-gray-900">
                {{ weather.current.temp }}&deg;C
              </div>
              <div class="text-sm text-gray-500">
                {{ weather.current.weather }} / 체감
                {{ weather.current.tempSense }}&deg;C
              </div>
            </div>
          </div>
          <!-- Dust Info -->
          <div class="flex gap-4 rounded-lg bg-gray-50 p-3">
            <div class="flex-1 text-center">
              <div class="text-xs text-gray-500">미세먼지</div>
              <div
                class="mt-1 text-sm font-semibold"
                :class="getDustLevel(weather.current.dust.pm10).color"
              >
                {{ getDustLevel(weather.current.dust.pm10).label }}
              </div>
              <div class="text-xs text-gray-400">
                {{ weather.current.dust.pm10 }}
              </div>
            </div>
            <div class="w-px bg-gray-200" />
            <div class="flex-1 text-center">
              <div class="text-xs text-gray-500">초미세먼지</div>
              <div
                class="mt-1 text-sm font-semibold"
                :class="getDustLevel(weather.current.dust.pm25).color"
              >
                {{ getDustLevel(weather.current.dust.pm25).label }}
              </div>
              <div class="text-xs text-gray-400">
                {{ weather.current.dust.pm25 }}
              </div>
            </div>
          </div>
          <!-- Forecast -->
          <div
            v-if="weather.forecast.length > 0"
            class="flex gap-2 overflow-x-auto"
          >
            <div
              v-for="fc in weather.forecast.slice(0, 5)"
              :key="fc.date"
              class="flex min-w-[60px] flex-col items-center rounded-lg bg-gray-50 px-2 py-2 text-xs"
            >
              <span class="text-gray-500">{{
                fc.date.slice(5).replace('-', '/')
              }}</span>
              <img
                :src="getWeatherIconUrl(fc.icon)"
                :alt="fc.weather"
                class="my-1 h-8 w-8"
              />
              <span class="font-medium text-gray-700"
                >{{ fc.temp }}&deg;</span
              >
            </div>
          </div>
          <div class="text-right text-xs text-gray-400">
            {{ weather.update }} 업데이트
          </div>
        </div>
        <div v-else class="py-6 text-center text-sm text-gray-400">
          날씨 정보를 불러올 수 없습니다
        </div>
      </section>

      <!-- Announcement Card -->
      <section class="rounded-xl bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">공지사항</h2>
        <div
          v-if="settings.announcement"
          class="whitespace-pre-wrap rounded-lg bg-primary-50 p-4 text-sm leading-relaxed text-gray-700"
        >
          {{ settings.announcement }}
        </div>
        <div v-else class="py-6 text-center text-sm text-gray-400">
          등록된 공지사항이 없습니다
        </div>
      </section>

      <!-- Today's Feeding Schedule Card -->
      <section class="rounded-xl bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">
          오늘의 급식 현황
        </h2>
        <div v-if="recordsLoading" class="flex items-center justify-center py-6">
          <div
            class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
          />
        </div>
        <div
          v-else-if="todayRecords.length > 0"
          class="space-y-3"
        >
          <div
            v-for="(records, course) in recordsByCourse"
            :key="course"
            class="rounded-lg bg-gray-50 p-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="courseColors[course as string] ?? 'bg-gray-100 text-gray-800'"
              >
                {{ course }}
              </span>
              <span class="text-xs text-gray-500">
                {{ records.length }}명
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="record in records"
                :key="record.id"
                class="rounded bg-white px-2 py-0.5 text-xs text-gray-600 shadow-sm"
              >
                {{ record.memberName }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <RouterLink
              to="/timetable"
              class="text-sm text-primary-500 hover:text-primary-600"
            >
              전체 일정 보기 &rarr;
            </RouterLink>
          </div>
        </div>
        <div v-else class="py-6 text-center">
          <p class="text-sm text-gray-400">오늘 급식 일정이 없습니다</p>
          <RouterLink
            v-if="auth.isLoggedIn"
            to="/timetable"
            class="mt-2 inline-block text-sm text-primary-500 hover:text-primary-600"
          >
            급식 신청하기 &rarr;
          </RouterLink>
        </div>
      </section>
    </div>

    <!-- Activities Section -->
    <section>
      <h2 class="mb-4 text-xl font-semibold text-gray-800">주요 활동</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <div
          v-for="activity in [
            { name: '급식', image: '/images/feeding.jpg' },
            { name: 'TNR', image: '/images/tnr.jpg' },
            { name: '구조 및 구호', image: '/images/rescue.jpg' },
            { name: '겨울집 제작', image: '/images/shelter.jpg' },
            { name: '기타 봉사활동', image: '/images/etc.jpg' },
          ]"
          :key="activity.name"
          class="group overflow-hidden rounded-xl shadow-sm"
        >
          <div class="relative aspect-square">
            <img
              :src="activity.image"
              :alt="activity.name"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8"
            >
              <span class="text-sm font-medium text-white">
                {{ activity.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
