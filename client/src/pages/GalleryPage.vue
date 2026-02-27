<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PhotoDetailModal from '@/components/PhotoDetailModal.vue';
import PhotoUploadModal from '@/components/PhotoUploadModal.vue';

interface Photo {
  id: number;
  filename: string;
  size: number;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
  likesCount: number;
}

interface Tag {
  id: number;
  name: string;
  photoCount: number;
  likesCount: number;
}

interface RankedPhoto {
  photoId: number;
  likesInPeriod: number;
  filename: string;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
  totalLikes: number;
}

interface Photographer {
  uploaderId: number;
  uploaderName: string;
  photoCount: number;
  totalLikes: number;
  latestPhoto: string;
  latestFilename: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// View tabs
const currentView = ref<'all' | 'ranking' | 'photographers'>('all');

const showUploadModal = ref(false);

function onPhotoUploaded() {
  resetAndFetch();
  fetchTags();
}

// ── All Photos View ──
const photos = ref<Photo[]>([]);
const tags = ref<Tag[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(true);

const page = ref(1);
const limit = 20;
const total = ref(0);

const selectedTag = ref('');
const selectedUploader = ref<number | undefined>(undefined);
const uploaderFilterName = ref('');
const sortBy = ref<'latest' | 'likes'>('latest');

async function fetchTags() {
  try {
    const { data } = await api.get('/gallery/tags');
    tags.value = data.data;
  } catch {
    tags.value = [];
  }
}

async function fetchPhotos(append = false) {
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }

  try {
    const params: Record<string, string | number> = {
      page: page.value,
      limit,
      sort: sortBy.value,
    };
    if (selectedTag.value) {
      params.tag = selectedTag.value;
    }
    if (selectedUploader.value !== undefined) {
      params.uploader = selectedUploader.value;
    }

    const { data } = await api.get('/gallery/photos', { params });

    if (append) {
      photos.value = [...photos.value, ...data.data];
    } else {
      photos.value = data.data;
    }
    total.value = data.total;
    hasMore.value = page.value < Math.ceil(data.total / limit);
  } catch {
    if (!append) {
      photos.value = [];
      total.value = 0;
    }
    hasMore.value = false;
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function resetAndFetch() {
  page.value = 1;
  hasMore.value = true;
  fetchPhotos(false);
}

function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  page.value++;
  fetchPhotos(true);
}

function onTagChange(tag: string) {
  selectedTag.value = tag;
  resetAndFetch();
}

function onSortChange(sort: 'latest' | 'likes') {
  sortBy.value = sort;
  resetAndFetch();
}

function clearUploaderFilter() {
  selectedUploader.value = undefined;
  uploaderFilterName.value = '';
  resetAndFetch();
}

function thumbnailUrl(filename: string): string {
  return `/gallery/thumb_${filename}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}.${m}.${day}`;
}

// Infinite scroll
function onScroll() {
  if (currentView.value !== 'all') return;
  if (loading.value || loadingMore.value || !hasMore.value) return;
  const scrollBottom = window.innerHeight + window.scrollY;
  const docHeight = document.documentElement.offsetHeight;
  if (scrollBottom >= docHeight - 400) {
    loadMore();
  }
}

// Photo detail modal
const selectedPhotoId = ref<number | null>(null);

function openPhoto(photoId: number) {
  router.push({ name: 'gallery', query: { photo: photoId } });
}

function closePhoto() {
  router.push({ name: 'gallery', query: {} });
}

function onPhotoLiked(photoId: number, newCount: number) {
  const photo = photos.value.find((p) => p.id === photoId);
  if (photo) {
    photo.likesCount = newCount;
  }
}

// Sync modal with route query
watch(
  () => route.query.photo,
  (val) => {
    if (val) {
      selectedPhotoId.value = Number(val);
    } else {
      selectedPhotoId.value = null;
    }
  },
  { immediate: true },
);

// ── Ranking View ──
const rankingType = ref<'weekly' | 'monthly' | 'last_month'>('weekly');
const rankedPhotos = ref<RankedPhoto[]>([]);
const rankingLoading = ref(false);

async function fetchRanking() {
  rankingLoading.value = true;
  try {
    const { data } = await api.get('/gallery/ranking', {
      params: { type: rankingType.value },
    });
    rankedPhotos.value = data.data;
  } catch {
    rankedPhotos.value = [];
  } finally {
    rankingLoading.value = false;
  }
}

function onRankingTypeChange(type: 'weekly' | 'monthly' | 'last_month') {
  rankingType.value = type;
  fetchRanking();
}

const rankingTypeLabel = computed(() => {
  switch (rankingType.value) {
    case 'weekly':
      return '주간';
    case 'monthly':
      return '월간';
    case 'last_month':
      return '지난달';
    default:
      return '주간';
  }
});

// ── Photographers View ──
const photographers = ref<Photographer[]>([]);
const photographersLoading = ref(false);

async function fetchPhotographers() {
  photographersLoading.value = true;
  try {
    const { data } = await api.get('/gallery/photographers');
    photographers.value = data.data;
  } catch {
    photographers.value = [];
  } finally {
    photographersLoading.value = false;
  }
}

function filterByPhotographer(uploaderId: number, uploaderName: string) {
  currentView.value = 'all';
  selectedUploader.value = uploaderId;
  uploaderFilterName.value = uploaderName;
  resetAndFetch();
}

// ── View switching ──
function switchView(view: 'all' | 'ranking' | 'photographers') {
  currentView.value = view;
  if (view === 'ranking') {
    fetchRanking();
  } else if (view === 'photographers') {
    fetchPhotographers();
  }
}

onMounted(() => {
  fetchTags();
  fetchPhotos();
  window.addEventListener('scroll', onScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-xl font-bold text-gray-800 sm:text-2xl">갤러리</h1>

        <!-- Upload button (logged-in users only, always visible) -->
        <button
          v-if="authStore.isLoggedIn"
          class="flex items-center gap-1.5 self-start rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          @click="showUploadModal = true"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          업로드
        </button>
      </div>

      <!-- View tabs -->
      <div class="flex gap-1 rounded-lg border border-gray-200 p-1">
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="currentView === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="switchView('all')"
        >
          전체
        </button>
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="currentView === 'ranking' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="switchView('ranking')"
        >
          랭킹
        </button>
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="currentView === 'photographers' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="switchView('photographers')"
        >
          포토그래퍼
        </button>
      </div>
    </div>

    <!-- ═══════════════════ ALL PHOTOS VIEW ═══════════════════ -->
    <template v-if="currentView === 'all'">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Uploader filter badge -->
        <div
          v-if="selectedUploader !== undefined"
          class="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
        >
          {{ uploaderFilterName }}님의 사진
          <button
            class="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-primary-500 hover:bg-primary-100 hover:text-primary-700"
            @click="clearUploaderFilter"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tag filter -->
        <select
          :value="selectedTag"
          class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          @change="onTagChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="">전체 태그</option>
          <option v-for="tag in tags" :key="tag.id" :value="tag.name">
            {{ tag.name }} ({{ tag.photoCount }})
          </option>
        </select>

        <!-- Sort buttons -->
        <div class="flex rounded-lg border border-gray-300">
          <button
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="sortBy === 'latest' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
            @click="onSortChange('latest')"
          >
            최신순
          </button>
          <button
            class="border-l border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors"
            :class="sortBy === 'likes' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
            @click="onSortChange('likes')"
          >
            좋아요순
          </button>
        </div>
      </div>

      <!-- Photo count -->
      <div v-if="!loading" class="px-1 text-sm text-gray-500">
        총 {{ total }}장의 사진
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>

      <!-- Empty state -->
      <div v-else-if="photos.length === 0" class="rounded-xl bg-white py-16 text-center shadow-sm">
        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="mt-3 text-sm text-gray-500">
          {{ selectedTag ? `'${selectedTag}' 태그의 사진이 없습니다` : '등록된 사진이 없습니다' }}
        </p>
      </div>

      <!-- Photo Grid -->
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
          @click="openPhoto(photo.id)"
        >
          <!-- Thumbnail -->
          <div class="relative aspect-square overflow-hidden bg-gray-100">
            <img
              :src="thumbnailUrl(photo.filename)"
              :alt="`Photo by ${photo.uploaderName}`"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <!-- Likes badge -->
            <div
              v-if="photo.likesCount > 0"
              class="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white"
            >
              <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {{ photo.likesCount }}
            </div>
          </div>

          <!-- Info -->
          <div class="p-2.5">
            <div class="flex items-center justify-between">
              <span class="truncate text-xs font-medium text-gray-700">
                {{ photo.uploaderName }}
              </span>
              <span class="flex-shrink-0 text-xs text-gray-400">
                {{ formatDate(photo.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Load more spinner -->
      <div v-if="loadingMore" class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>

      <!-- End of list -->
      <div v-if="!loading && !hasMore && photos.length > 0" class="py-4 text-center text-sm text-gray-400">
        모든 사진을 불러왔습니다
      </div>
    </template>

    <!-- ═══════════════════ RANKING VIEW ═══════════════════ -->
    <template v-if="currentView === 'ranking'">
      <!-- Period tabs -->
      <div class="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="rankingType === 'weekly' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="onRankingTypeChange('weekly')"
        >
          주간
        </button>
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="rankingType === 'monthly' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="onRankingTypeChange('monthly')"
        >
          월간
        </button>
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="rankingType === 'last_month' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="onRankingTypeChange('last_month')"
        >
          지난달
        </button>
      </div>

      <!-- Loading -->
      <div v-if="rankingLoading" class="flex items-center justify-center py-24">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>

      <!-- Empty ranking -->
      <div v-else-if="rankedPhotos.length === 0" class="rounded-xl bg-white py-16 text-center shadow-sm">
        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <p class="mt-3 text-sm text-gray-500">{{ rankingTypeLabel }} 랭킹 데이터가 없습니다</p>
      </div>

      <!-- Ranking list -->
      <div v-else class="space-y-3">
        <div
          v-for="(rp, index) in rankedPhotos"
          :key="rp.photoId"
          class="group flex cursor-pointer items-center gap-4 rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4"
          @click="openPhoto(rp.photoId)"
        >
          <!-- Rank number -->
          <div
            class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :class="{
              'bg-yellow-100 text-yellow-700': index === 0,
              'bg-gray-100 text-gray-500': index === 1,
              'bg-orange-50 text-orange-600': index === 2,
              'text-gray-400': index > 2,
            }"
          >
            {{ index + 1 }}
          </div>

          <!-- Thumbnail -->
          <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
            <img
              :src="thumbnailUrl(rp.filename)"
              :alt="`Photo by ${rp.uploaderName}`"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-800">{{ rp.uploaderName }}</p>
            <p class="mt-0.5 text-xs text-gray-500">{{ formatDate(rp.createdAt) }}</p>
          </div>

          <!-- Likes -->
          <div class="flex flex-shrink-0 flex-col items-end gap-1">
            <div class="flex items-center gap-1 text-sm font-semibold text-red-500">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              +{{ rp.likesInPeriod }}
            </div>
            <span class="text-xs text-gray-400">총 {{ rp.totalLikes }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══════════════════ PHOTOGRAPHERS VIEW ═══════════════════ -->
    <template v-if="currentView === 'photographers'">
      <!-- Loading -->
      <div v-if="photographersLoading" class="flex items-center justify-center py-24">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>

      <!-- Empty -->
      <div v-else-if="photographers.length === 0" class="rounded-xl bg-white py-16 text-center shadow-sm">
        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="mt-3 text-sm text-gray-500">포토그래퍼 데이터가 없습니다</p>
      </div>

      <!-- Photographer list -->
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="pg in photographers"
          :key="pg.uploaderId"
          class="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
          @click="filterByPhotographer(pg.uploaderId, pg.uploaderName)"
        >
          <!-- Latest photo as cover -->
          <div class="relative h-36 overflow-hidden bg-gray-100 sm:h-40">
            <img
              v-if="pg.latestFilename"
              :src="thumbnailUrl(pg.latestFilename)"
              :alt="`Latest by ${pg.uploaderName}`"
              class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div class="absolute bottom-3 left-3">
              <p class="text-sm font-semibold text-white">{{ pg.uploaderName }}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex items-center justify-around px-4 py-3">
            <div class="text-center">
              <p class="text-lg font-bold text-gray-800">{{ pg.photoCount }}</p>
              <p class="text-xs text-gray-500">사진</p>
            </div>
            <div class="h-6 w-px bg-gray-200" />
            <div class="text-center">
              <p class="text-lg font-bold text-red-500">{{ pg.totalLikes }}</p>
              <p class="text-xs text-gray-500">좋아요</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Photo detail modal -->
    <PhotoDetailModal
      v-if="selectedPhotoId !== null"
      :photo-id="selectedPhotoId"
      @close="closePhoto"
      @liked="onPhotoLiked"
    />

    <!-- Upload modal -->
    <PhotoUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="onPhotoUploaded"
    />
  </div>
</template>
