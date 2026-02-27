<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import api from '@/utils/api';

interface PhotoTag {
  id: number;
  name: string;
}

interface PhotoDetail {
  id: number;
  filename: string;
  size: number;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
  likesCount: number;
  tags: PhotoTag[];
}

const props = defineProps<{
  photoId: number;
}>();

const emit = defineEmits<{
  close: [];
  liked: [photoId: number, newCount: number];
}>();

const photo = ref<PhotoDetail | null>(null);
const loading = ref(true);
const liking = ref(false);
const likeError = ref('');

async function fetchDetail() {
  loading.value = true;
  try {
    const { data } = await api.get(`/gallery/photos/${props.photoId}`);
    photo.value = data;
  } catch {
    photo.value = null;
  } finally {
    loading.value = false;
  }
}

async function likePhoto() {
  if (!photo.value || liking.value) return;
  liking.value = true;
  likeError.value = '';

  try {
    await api.post(`/gallery/photos/${photo.value.id}/like`);
    photo.value.likesCount++;
    emit('liked', photo.value.id, photo.value.likesCount);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response: { status: number } }).response;
      if (response.status === 429) {
        likeError.value = '이미 최근 30일 내에 좋아요를 눌렀습니다';
      } else {
        likeError.value = '좋아요 처리에 실패했습니다';
      }
    } else {
      likeError.value = '좋아요 처리에 실패했습니다';
    }
  } finally {
    liking.value = false;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close');
  }
}

watch(() => props.photoId, fetchDetail, { immediate: true });

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      @click="onBackdropClick"
    >
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>

      <!-- Not found -->
      <div
        v-else-if="!photo"
        class="rounded-xl bg-white p-8 text-center"
      >
        <p class="text-gray-500">사진을 찾을 수 없습니다</p>
        <button
          class="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
          @click="emit('close')"
        >
          닫기
        </button>
      </div>

      <!-- Photo detail -->
      <div
        v-else
        class="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <!-- Close button -->
        <button
          class="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Image -->
        <div class="flex-shrink-0 overflow-auto bg-gray-900">
          <img
            :src="`/gallery/${photo.filename}`"
            :alt="`Photo by ${photo.uploaderName}`"
            class="mx-auto max-h-[65vh] object-contain"
          />
        </div>

        <!-- Info panel -->
        <div class="flex-shrink-0 border-t border-gray-100 p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <!-- Left: uploader & date -->
            <div>
              <p class="font-medium text-gray-800">{{ photo.uploaderName }}</p>
              <p class="mt-0.5 text-sm text-gray-500">{{ formatDate(photo.createdAt) }}</p>
            </div>

            <!-- Right: like button -->
            <div class="flex flex-col items-end">
              <button
                class="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                :class="{ 'opacity-50': liking }"
                :disabled="liking"
                @click="likePhoto"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {{ photo.likesCount }}
              </button>
              <p v-if="likeError" class="mt-1 text-xs text-red-500">{{ likeError }}</p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="photo.tags.length > 0" class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="tag in photo.tags"
              :key="tag.id"
              class="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
            >
              #{{ tag.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
