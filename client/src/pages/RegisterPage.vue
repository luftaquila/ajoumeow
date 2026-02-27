<script setup lang="ts">
import { ref, computed } from 'vue';
import api from '@/utils/api';

const collegeData: Record<string, string[]> = {
  의과대학: ['의학과'],
  간호대학: ['간호학과'],
  첨단바이오융합대학: ['첨단바이오융합대학'],
  약학대학: ['약학과'],
  공과대학: [
    '기계공학부',
    '산업공학과',
    '응용화학과',
    '화학공학과',
    '첨단신소재공학과',
    '환경안전공학과',
    '건설시스템공학과',
    '교통시스템공학과',
    '건축학과',
    '융합시스템공학과',
  ],
  첨단ICT융합대학: ['전자공학과', '지능형반도체공학과', '미래모빌리티공학과'],
  소프트웨어융합대학: [
    '소프트웨어학과',
    '인공지능융합학과',
    '디지털미디어학과',
    '사이버보안학과',
    '국방디지털융합학과',
  ],
  경영대학: ['경영학과', '경영인텔리전스학과', '금융공학과', '글로벌경영학과'],
  인문대학: ['국어국문학과', '영어영문학과', '불어불문학과', '사학과', '문화콘텐츠학과'],
  사회과학대학: ['행정학과', '심리학과', '스포츠레저학과', '경제정치사회융합학부'],
  자연과학대학: ['수학과', '프런티어과학학부'],
  다산학부대학: ['자유전공학부(자연)', '자유전공학부(인문)'],
  기타: ['기타'],
};

const colleges = Object.keys(collegeData);

const form = ref({
  studentId: '',
  name: '',
  college: colleges[0],
  department: collegeData[colleges[0]][0],
  phone: '',
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);
const submitted = ref(false);
const serverError = ref('');
const agreePrivacy = ref(false);

const departments = computed(() => collegeData[form.value.college] ?? []);

function onCollegeChange() {
  const deps = departments.value;
  form.value.department = deps.length > 0 ? deps[0] : '';
}

function formatPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 4) return digits;
  if (digits.length < 8) return digits.slice(0, 3) + '-' + digits.slice(3);
  return digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7, 11);
}

function onPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement;
  form.value.phone = formatPhone(input.value);
}

function validate(): boolean {
  const newErrors: Record<string, string> = {};

  if (!form.value.name.trim()) {
    newErrors.name = '이름을 입력해주세요.';
  }

  if (!form.value.studentId.trim()) {
    newErrors.studentId = '학번을 입력해주세요.';
  } else if (!/^\d{9}$/.test(form.value.studentId.trim())) {
    newErrors.studentId = '학번은 9자리 숫자여야 합니다.';
  }

  if (!form.value.phone.trim()) {
    newErrors.phone = '연락처를 입력해주세요.';
  } else if (!/^010-\d{4}-\d{4}$/.test(form.value.phone.trim())) {
    newErrors.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
  }

  if (!form.value.college) {
    newErrors.college = '단과대학을 선택해주세요.';
  }

  if (!form.value.department) {
    newErrors.department = '학과를 선택해주세요.';
  }

  if (!agreePrivacy.value) {
    newErrors.agree = '개인정보 수집 및 이용에 동의해주세요.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

async function handleSubmit() {
  serverError.value = '';
  if (!validate()) return;

  loading.value = true;
  try {
    await api.post('/users/register', {
      student_id: form.value.studentId.trim(),
      name: form.value.name.trim(),
      college: form.value.college,
      department: form.value.department,
      phone: form.value.phone.trim(),
    });
    submitted.value = true;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
    if (axiosErr.response?.status === 409) {
      serverError.value =
        axiosErr.response.data?.error === 'Already registered as a member in current semester'
          ? '이미 현재 학기에 등록된 회원입니다.'
          : '이미 가입 신청을 제출하셨습니다.';
    } else {
      serverError.value = '가입 신청에 실패했습니다. 다시 시도해주세요.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center py-8">
    <!-- Success state -->
    <div v-if="submitted" class="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
      <span class="text-5xl">🎉</span>
      <h2 class="mt-4 text-2xl font-bold text-gray-900">가입 신청 완료!</h2>
      <p class="mt-3 text-gray-600">
        가입 신청이 성공적으로 접수되었습니다.<br />
        관리자 승인 후 활동하실 수 있습니다.
      </p>
      <RouterLink
        to="/"
        class="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
      >
        홈으로 돌아가기
      </RouterLink>
    </div>

    <!-- Registration form -->
    <div v-else class="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-6 text-center">
        <span class="text-5xl">🐾</span>
        <h1 class="mt-4 text-2xl font-bold text-gray-900">미유미유 가입 신청</h1>
        <p class="mt-2 text-sm text-gray-500">아래 정보를 입력하여 가입을 신청해주세요</p>
      </div>

      <!-- New/returning member info -->
      <div class="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <p class="font-medium">신규 회원 / 복귀 회원 안내</p>
        <ul class="mt-1 list-inside list-disc text-blue-600">
          <li><strong>신규 회원:</strong> 처음 가입하시는 분은 모든 정보를 입력해주세요.</li>
          <li>
            <strong>복귀 회원:</strong> 이전 학기에 활동한 적이 있는 분도 동일하게 신청해주세요.
          </li>
        </ul>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name -->
        <div>
          <label for="name" class="mb-1 block text-sm font-medium text-gray-700">이름</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="이름을 입력하세요"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            :class="{ 'border-red-400': errors.name }"
            :disabled="loading"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
        </div>

        <!-- Student ID -->
        <div>
          <label for="studentId" class="mb-1 block text-sm font-medium text-gray-700">학번</label>
          <input
            id="studentId"
            v-model="form.studentId"
            type="text"
            inputmode="numeric"
            placeholder="예: 202012345"
            maxlength="9"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            :class="{ 'border-red-400': errors.studentId }"
            :disabled="loading"
          />
          <p v-if="errors.studentId" class="mt-1 text-sm text-red-500">{{ errors.studentId }}</p>
        </div>

        <!-- College -->
        <div>
          <label for="college" class="mb-1 block text-sm font-medium text-gray-700"
            >단과대학</label
          >
          <select
            id="college"
            v-model="form.college"
            @change="onCollegeChange"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            :class="{ 'border-red-400': errors.college }"
            :disabled="loading"
          >
            <option v-for="college in colleges" :key="college" :value="college">
              {{ college }}
            </option>
          </select>
          <p v-if="errors.college" class="mt-1 text-sm text-red-500">{{ errors.college }}</p>
        </div>

        <!-- Department -->
        <div>
          <label for="department" class="mb-1 block text-sm font-medium text-gray-700">학과</label>
          <select
            id="department"
            v-model="form.department"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            :class="{ 'border-red-400': errors.department }"
            :disabled="loading"
          >
            <option v-for="dept in departments" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
          <p v-if="errors.department" class="mt-1 text-sm text-red-500">{{ errors.department }}</p>
        </div>

        <!-- Phone -->
        <div>
          <label for="phone" class="mb-1 block text-sm font-medium text-gray-700">연락처</label>
          <input
            id="phone"
            :value="form.phone"
            @input="onPhoneInput"
            type="tel"
            placeholder="010-1234-5678"
            maxlength="13"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            :class="{ 'border-red-400': errors.phone }"
            :disabled="loading"
          />
          <p v-if="errors.phone" class="mt-1 text-sm text-red-500">{{ errors.phone }}</p>
        </div>

        <!-- Privacy agreement -->
        <div class="rounded-lg border border-gray-200 p-4">
          <p class="mb-2 text-sm font-medium text-gray-700">개인정보 수집 및 이용 동의</p>
          <div class="mb-3 max-h-24 overflow-y-auto rounded bg-gray-50 p-3 text-xs text-gray-500">
            아주대학교 동아리 미유미유에서는 다음과 같이 개인정보를 수집 및 이용하고 있습니다.<br /><br />
            - 수집 및 이용 목적: 가입 신청 처리 및 신청자 개별 연락<br />
            - 항목: 이름, 학번, 소속, 휴대폰번호
          </div>
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="agreePrivacy"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              :disabled="loading"
            />
            <span class="text-sm text-gray-700">동의합니다</span>
          </label>
          <p v-if="errors.agree" class="mt-1 text-sm text-red-500">{{ errors.agree }}</p>
        </div>

        <!-- Server error -->
        <div
          v-if="serverError"
          class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ serverError }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading"
        >
          <span v-if="loading">신청 중...</span>
          <span v-else>가입 신청하기</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">
          이미 회원이신가요?
          <RouterLink to="/login" class="font-medium text-primary-600 hover:text-primary-500">
            로그인
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
