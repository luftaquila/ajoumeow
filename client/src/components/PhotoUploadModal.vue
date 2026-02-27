<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/utils/api';

interface Tag {
  id: number;
  name: string;
}

const emit = defineEmits<{
  close: [];
  uploaded: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const dragging = ref(false);

const tagInput = ref('');
const selectedTags = ref<string[]>([]);
const availableTags = ref<Tag[]>([]);
const showTagSuggestions = ref(false);

const uploading = ref(false);
const errorMessage = ref('');

const filteredTags = computed(() => {
  if (!tagInput.value) return availableTags.value.filter((t) => !selectedTags.value.includes(t.name));
  const q = tagInput.value.toLowerCase();
  return availableTags.value.filter(
    (t) => t.name.toLowerCase().includes(q) && !selectedTags.value.includes(t.name),
  );
});

async function fetchTags() {
  try {
    const { data } = await api.get('/gallery/tags');
    availableTags.value = data.data;
  } catch {
    availableTags.value = [];
  }
}

function triggerFileSelect() {
  fileInput.value?.click();
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    setFile(input.files[0]);
  }
}

function setFile(file: File) {
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '이미지 파일만 업로드할 수 있습니다';
    return;
  }
  selectedFile.value = file;
  errorMessage.value = '';

  // Create preview
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = URL.createObjectURL(file);
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  dragging.value = true;
}

function onDragLeave() {
  dragging.value = false;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    setFile(event.dataTransfer.files[0]);
  }
}

function removeFile() {
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function addTag(tagName: string) {
  const trimmed = tagName.trim();
  if (trimmed && !selectedTags.value.includes(trimmed)) {
    selectedTags.value.push(trimmed);
  }
  tagInput.value = '';
  showTagSuggestions.value = false;
}

function addTagFromInput() {
  if (tagInput.value.trim()) {
    addTag(tagInput.value);
  }
}

function removeTag(index: number) {
  selectedTags.value.splice(index, 1);
}

function onTagInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (filteredTags.value.length > 0) {
      addTag(filteredTags.value[0].name);
    } else {
      addTagFromInput();
    }
  }
}

async function upload() {
  if (!selectedFile.value) return;

  uploading.value = true;
  errorMessage.value = '';

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('tags', JSON.stringify(selectedTags.value));

    await api.post('/gallery/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    emit('uploaded');
    emit('close');
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: string } } };
    errorMessage.value = axiosErr.response?.data?.error || '업로드에 실패했습니다';
  } finally {
    uploading.value = false;
  }
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close');
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

function onTagInputFocus() {
  showTagSuggestions.value = true;
}

function onTagInputBlur() {
  // Delay to allow clicking on suggestions
  setTimeout(() => {
    showTagSuggestions.value = false;
  }, 200);
}

onMounted(() => {
  fetchTags();
  document.addEventListener('keydown', onEscape);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', onEscape);
  document.body.style.overflow = '';
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click="onBackdropClick">
    <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 class="text-lg font-bold text-gray-800">사진 업로드</h2>
        <button class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" @click="emit('close')">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4 p-6">
        <!-- File drop zone / Preview -->
        <div v-if="!selectedFile"
          class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-colors"
          :class="dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'"
          @click="triggerFileSelect"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <svg class="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-sm font-medium text-gray-600">클릭하거나 파일을 드래그하세요</p>
          <p class="mt-1 text-xs text-gray-400">이미지 파일만 가능</p>
        </div>

        <!-- Preview -->
        <div v-else class="relative">
          <img :src="previewUrl!" alt="미리보기" class="max-h-64 w-full rounded-xl object-contain bg-gray-100" />
          <button
            class="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
            @click="removeFile"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="mt-2 text-xs text-gray-500">
            {{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(1) }}MB)
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />

        <!-- Tags -->
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">태그</label>
          <!-- Selected tags -->
          <div v-if="selectedTags.length > 0" class="mb-2 flex flex-wrap gap-1.5">
            <span
              v-for="(tag, index) in selectedTags"
              :key="tag"
              class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
            >
              {{ tag }}
              <button class="text-primary-400 hover:text-primary-600" @click="removeTag(index)">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <!-- Tag input with autocomplete -->
          <div class="relative">
            <input
              v-model="tagInput"
              type="text"
              placeholder="태그를 입력하세요"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              @keydown="onTagInputKeydown"
              @focus="onTagInputFocus"
              @blur="onTagInputBlur"
            />
            <!-- Suggestions dropdown -->
            <div
              v-if="showTagSuggestions && filteredTags.length > 0"
              class="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              <button
                v-for="tag in filteredTags"
                :key="tag.id"
                class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                @mousedown.prevent="addTag(tag.name)"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <!-- Upload button -->
        <button
          :disabled="!selectedFile || uploading"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="upload"
        >
          <div v-if="uploading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {{ uploading ? '업로드 중...' : '업로드' }}
        </button>
      </div>
    </div>
  </div>
</template>
