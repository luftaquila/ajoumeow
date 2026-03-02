<template>
  <Drawer v-model:visible="drawerVisible" position="right" :style="{ width: '80%', maxWidth: '320px' }">
    <template #header>
      <span></span>
    </template>
    <div class="text-sm flex flex-col h-full">
      <!-- Login form -->
      <div v-if="!isLoggedIn" class="text-center">
        <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <i class="i-lucide-id-card text-2xl text-primary"></i>
        </div>
        <p class="text-text-secondary text-sm mb-4">학번으로 로그인하세요</p>
        <div class="flex flex-col items-center gap-3">
          <InputText
            v-model="loginId"
            placeholder="학번"
            class="h-11 text-center text-lg w-full max-w-[200px] border-surface-border focus:border-primary transition-colors duration-200"
            @keyup.enter="onLogin"
          />
          <Button label="로그인" severity="info" class="w-full max-w-[200px]" @click="onLogin" />
          <a href="/apply"><Button label="회원 등록" severity="success" class="w-full max-w-[200px]" /></a>
        </div>
      </div>

      <!-- User info -->
      <div v-else class="flex flex-col flex-1">
        <div class="text-center mb-5">
          <div class="text-base font-semibold text-text">
            {{ user.name }}
          </div>
          <span class="inline-block mt-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-lg font-medium">{{ user.role }}</span>
          <div class="text-text-secondary mt-1">안녕하세요!</div>
          <div class="mt-3">
            <Button label="로그아웃" severity="danger" size="small" @click="onLogout" />
          </div>
        </div>

        <div class="border-t border-surface-border pt-4 mx-1">
          <!-- Unified stats card -->
          <div class="bg-surface-dim rounded-xl p-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="text-center">
                <div class="text-lg font-bold text-text">{{ mileageTotal }}<span class="text-[10px] font-normal text-text-muted ml-0.5">점</span></div>
                <div class="text-[11px] text-text-muted mt-0.5">마일리지</div>
                <div class="text-[10px] text-text-muted mt-1">이번 달 <span class="text-primary font-medium">{{ mileageThis }}점</span></div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-text">{{ feedingTotal }}<span class="text-[10px] font-normal text-text-muted ml-0.5">회</span></div>
                <div class="text-[11px] text-text-muted mt-0.5">급식</div>
                <div class="text-[10px] text-text-muted mt-1">이번 달 <span class="text-primary font-medium">{{ feedingThis }}회</span></div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-text">{{ timeTotal }}<span class="text-[10px] font-normal text-text-muted ml-0.5">h</span></div>
                <div class="text-[11px] text-text-muted mt-0.5">봉사</div>
                <div class="text-[10px] text-text-muted mt-1">이번 달 <span class="text-primary font-medium">{{ timeThis }}h</span></div>
              </div>
            </div>
            <button
              ref="historyBtn"
              class="mt-3 w-full py-2 rounded-lg bg-transparent border border-surface-border/50 text-text-secondary text-xs font-medium cursor-pointer hover:bg-surface hover:text-text transition-colors duration-200 flex items-center justify-center gap-1.5"
              @click="toggleHistory"
            >
              <i class="i-lucide-clipboard-list text-sm"></i> 급식 기록
            </button>
          </div>
          <a v-if="isAdmin" href="/console" class="flex items-center gap-2 text-primary no-underline text-sm font-semibold hover:text-primary-dark transition-colors duration-200 px-2 py-2.5 mt-2 rounded-lg hover:bg-primary/5">
            <i class="i-lucide-settings text-base"></i> 관리자 콘솔
          </a>
        </div>

        <Popover ref="historyPopover" appendTo="body">
          <div class="w-[300px] max-h-[320px] overflow-y-auto">
            <table v-if="historyRows.length" class="w-full text-xs">
              <thead>
                <tr class="text-text-muted border-b border-surface-border/50">
                  <th class="text-left py-1.5 font-medium">날짜</th>
                  <th class="text-center py-1.5 font-medium w-16">코스</th>
                  <th class="text-right py-1.5 font-medium w-12">점수</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in historyRows" :key="row.index" class="border-b border-surface-border/20 last:border-b-0">
                  <td class="text-text-secondary py-1.5">{{ row.date }}</td>
                  <td class="text-text text-center py-1.5 font-medium">{{ row.course }}</td>
                  <td class="text-primary text-right py-1.5 font-bold">{{ row.score }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="py-6 text-center text-text-muted text-xs">
              기록이 없습니다.
            </div>
          </div>
        </Popover>
      </div>

      <!-- Bottom actions -->
      <div class="mt-auto pt-6">
        <div class="flex items-center justify-center gap-2 mb-3">
          <button
            class="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted text-lg cursor-pointer bg-transparent border-none hover:bg-surface-dim transition-colors duration-200"
            @click="toggleTheme"
          >
            <i :class="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"></i>
          </button>
          <a
            href="https://github.com/luftaquila/ajoumeow"
            class="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted text-lg no-underline hover:bg-surface-dim transition-colors duration-200"
          >
            <i class="i-lucide-github"></i>
          </a>
        </div>
        <div class="text-center text-[11px] text-text-muted">
          이 사이트가 마음에 들지 않는 분은 <span class="animate-rainbow cursor-pointer font-medium" @click="drawerVisible = false; openModal('recruit')">여기</span>를 누르세요
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import Drawer from 'primevue/drawer'
import Popover from 'primevue/popover'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useAuth } from '../composables/useAuth.js'
import { useRecords } from '../composables/useRecords.js'
import { useTheme } from '../composables/useTheme.js'
import { useModal } from '../composables/useModal.js'
import { formatDate } from '../utils/dateFormat.js'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => { if (!val) emit('close') },
})

const { user, isLoggedIn, isAdmin, doLogin, logout, statistics, mileageTotal, mileageThis, timeTotal, timeThis } = useAuth()
const { load } = useRecords()
const { isDark, toggleTheme } = useTheme()
const { openModal } = useModal()

const historyBtn = ref(null)
const historyPopover = ref(null)

const feedingTotal = computed(() => statistics.value.length)
const feedingThis = computed(() => {
  const thisMonth = formatDate(new Date(), 'yyyy-mm')
  return statistics.value.filter(obj => formatDate(new Date(obj.date), 'yyyy-mm') === thisMonth).length
})

const historyRows = computed(() =>
  statistics.value.map((obj, i) => ({
    index: statistics.value.length - i,
    date: formatDate(new Date(obj.date), 'yyyy.mm.dd'),
    course: obj.course,
    score: `${obj.score}점`,
  }))
)

function toggleHistory(event) {
  historyPopover.value.toggle(event)
}

const loginId = ref('')

async function onLogin() {
  if (!loginId.value) return
  await doLogin(loginId.value)
  if (isLoggedIn.value) await load()
}

function onLogout() {
  logout()
  load()
}
</script>
