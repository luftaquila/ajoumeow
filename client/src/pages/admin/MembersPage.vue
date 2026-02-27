<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/utils/api';

interface Member {
  id: number;
  studentId: string;
  name: string;
  college: string;
  department: string;
  phone: string;
  birthday: string | null;
  volunteerId: string | null;
  role: string;
  registeredAt: string;
}

interface EditForm {
  name: string;
  college: string;
  department: string;
  phone: string;
  birthday: string;
  volunteerId: string;
  role: string;
}

const members = ref<Member[]>([]);
const loading = ref(true);
const searchQuery = ref('');

const editModalOpen = ref(false);
const editTarget = ref<Member | null>(null);
const editForm = ref<EditForm>({
  name: '',
  college: '',
  department: '',
  phone: '',
  birthday: '',
  volunteerId: '',
  role: '',
});
const editSaving = ref(false);
const editError = ref('');

const deleteConfirmOpen = ref(false);
const deleteTarget = ref<Member | null>(null);
const deleteLoading = ref(false);

const roleOptions = ['회장', '부회장', '총무', '회원'];

const filteredMembers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return members.value;
  return members.value.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q),
  );
});

async function fetchMembers() {
  loading.value = true;
  try {
    const { data } = await api.get('/users/list');
    members.value = data;
  } catch {
    members.value = [];
  } finally {
    loading.value = false;
  }
}

function openEditModal(member: Member) {
  editTarget.value = member;
  editForm.value = {
    name: member.name,
    college: member.college,
    department: member.department,
    phone: member.phone,
    birthday: member.birthday ?? '',
    volunteerId: member.volunteerId ?? '',
    role: member.role,
  };
  editError.value = '';
  editModalOpen.value = true;
}

function closeEditModal() {
  editModalOpen.value = false;
  editTarget.value = null;
}

async function saveEdit() {
  if (!editTarget.value) return;
  editSaving.value = true;
  editError.value = '';

  try {
    await api.put(`/users/${editTarget.value.studentId}`, {
      name: editForm.value.name,
      college: editForm.value.college,
      department: editForm.value.department,
      phone: editForm.value.phone,
      birthday: editForm.value.birthday || null,
      volunteer_id: editForm.value.volunteerId || null,
      role: editForm.value.role,
    });
    closeEditModal();
    await fetchMembers();
  } catch {
    editError.value = '회원 정보 수정에 실패했습니다.';
  } finally {
    editSaving.value = false;
  }
}

function openDeleteConfirm(member: Member) {
  deleteTarget.value = member;
  deleteConfirmOpen.value = true;
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false;
  deleteTarget.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;

  try {
    await api.delete(`/users/${deleteTarget.value.studentId}`);
    closeDeleteConfirm();
    await fetchMembers();
  } catch {
    closeDeleteConfirm();
  } finally {
    deleteLoading.value = false;
  }
}

onMounted(() => {
  fetchMembers();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-gray-800">회원 관리</h1>

      <!-- Search -->
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="이름 또는 학번 검색"
          class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-64"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
      />
    </div>

    <!-- Members Table -->
    <div v-else-if="members.length > 0" class="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b bg-gray-50 text-left text-xs text-gray-500">
            <th class="px-4 py-3 font-medium">학번</th>
            <th class="px-4 py-3 font-medium">이름</th>
            <th class="hidden px-4 py-3 font-medium md:table-cell">단과대</th>
            <th class="hidden px-4 py-3 font-medium lg:table-cell">학과</th>
            <th class="hidden px-4 py-3 font-medium sm:table-cell">연락처</th>
            <th class="px-4 py-3 font-medium">역할</th>
            <th class="px-4 py-3 font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in filteredMembers"
            :key="member.id"
            class="cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50"
            @click="openEditModal(member)"
          >
            <td class="px-4 py-3 text-gray-600">{{ member.studentId }}</td>
            <td class="px-4 py-3 font-medium text-gray-800">{{ member.name }}</td>
            <td class="hidden px-4 py-3 text-gray-600 md:table-cell">{{ member.college }}</td>
            <td class="hidden px-4 py-3 text-gray-600 lg:table-cell">{{ member.department }}</td>
            <td class="hidden px-4 py-3 text-gray-600 sm:table-cell">{{ member.phone }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  member.role === '회원'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-primary-100 text-primary-700'
                "
              >
                {{ member.role }}
              </span>
            </td>
            <td class="px-4 py-3" @click.stop>
              <button
                class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                @click="openDeleteConfirm(member)"
              >
                제명
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="border-t px-4 py-3 text-sm text-gray-500">
        총 {{ filteredMembers.length }}명
        <span v-if="searchQuery.trim()"> (전체 {{ members.length }}명 중)</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center text-gray-400">등록된 회원이 없습니다</div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="editModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeEditModal"
      >
        <div
          class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          @keydown.escape="closeEditModal"
        >
          <h2 class="mb-4 text-lg font-semibold text-gray-800">회원 정보 수정</h2>

          <form class="space-y-4" @submit.prevent="saveEdit">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">학번</label>
              <input
                :value="editTarget?.studentId"
                disabled
                class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">이름</label>
              <input
                v-model="editForm.name"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">단과대</label>
              <input
                v-model="editForm.college"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">학과</label>
              <input
                v-model="editForm.department"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">연락처</label>
              <input
                v-model="editForm.phone"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">생년월일</label>
              <input
                v-model="editForm.birthday"
                type="text"
                placeholder="YYYY-MM-DD"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">1365 봉사 ID</label>
              <input
                v-model="editForm.volunteerId"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">역할</label>
              <select
                v-model="editForm.role"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option v-for="role in roleOptions" :key="role" :value="role">
                  {{ role }}
                </option>
              </select>
            </div>

            <div v-if="editError" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {{ editError }}
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                @click="closeEditModal"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="editSaving"
                class="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                {{ editSaving ? '저장 중...' : '저장' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeDeleteConfirm"
      >
        <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h2 class="mb-2 text-lg font-semibold text-gray-800">회원 제명</h2>
          <p class="mb-6 text-sm text-gray-600">
            <span class="font-medium">{{ deleteTarget?.name }}</span>
            ({{ deleteTarget?.studentId }})님을 현재 학기에서 제명하시겠습니까?
          </p>

          <div class="flex gap-3">
            <button
              class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              @click="closeDeleteConfirm"
            >
              취소
            </button>
            <button
              :disabled="deleteLoading"
              class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              @click="confirmDelete"
            >
              {{ deleteLoading ? '처리 중...' : '제명' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
