<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import PhotoDetailModal from '@/components/PhotoDetailModal.vue';

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

const route = useRoute();
const router = useRouter();

const photos = ref<Photo[]>([]);
const tags = ref<Tag[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(true);

const page = ref(1);
const limit = 20;
const total = ref(0);

const selectedTag = ref('');
const sortBy = ref<'latest' | 'likes'>('latest');

const totalPages = computed(() => Math.ceil(total.value / limit));

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
    <div class="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <h1 class="text-xl font-bold text-gray-800 sm:text-2xl">갤러리</h1>

      <div class="flex flex-wrap items-center gap-3">
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

    <!-- Photo detail modal -->
    <PhotoDetailModal
      v-if="selectedPhotoId !== null"
      :photo-id="selectedPhotoId"
      @close="closePhoto"
      @liked="onPhotoLiked"
    />
  </div>
</template>
