<template>
  <div>
    <PageHeader
      title="1365 봉사활동 인증서"
      description="봉사활동 인증서를 생성합니다."
      icon="i-lucide-hand-helping"
    />

    <div class="card-section max-w-lg">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-text-secondary">시작일</label>
            <DatePicker v-model="startDate" dateFormat="yy-mm-dd" class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-text-secondary">종료일</label>
            <DatePicker v-model="endDate" dateFormat="yy-mm-dd" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학기</label>
          <Select
            v-model="selectedSemester"
            :options="semesterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="학기 선택"
          />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="maskPrivacy" :binary="true" inputId="mask" />
          <label for="mask" class="text-sm cursor-pointer">개인정보 숨기기 (이름 마스킹)</label>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <Button
            label="인증서 문서 생성"
            icon="i-lucide-file-text"
            @click="generateCertificate"
            :loading="generating"
          />
          <Button
            label="Google Sheets 생성"
            icon="i-lucide-file-spreadsheet"
            severity="secondary"
            @click="doExport"
            :loading="exporting"
          />
        </div>

        <!-- Result URL panel -->
        <div v-if="resultUrl" class="flex items-center gap-2 p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20">
          <span class="i-lucide-check-circle text-lg text-[#22C55E]"></span>
          <a :href="resultUrl" target="_blank" rel="noopener" class="text-sm text-primary hover:underline break-all">
            {{ resultUrl }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import PageHeader from '../components/PageHeader.vue'
import { export1365, getCertificateData } from '../api/verifications.js'
import { useSemesters } from '../composables/useSemesters.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'

const toast = useToast()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref(new Date())
const selectedSemester = ref('')
const maskPrivacy = ref(false)
const exporting = ref(false)
const generating = ref(false)
const resultUrl = ref('')

const semesterOptions = ref([])

onMounted(async () => {
  await loadSemesters()
  semesterOptions.value = semesters.value.map(s => ({ label: s, value: s }))
  selectedSemester.value = currentSemester.value
})

function getParams() {
  if (!startDate.value || !endDate.value || !selectedSemester.value) {
    toast.add({ severity: 'warn', summary: '모든 항목을 입력해주세요.', life: 2000 })
    return null
  }
  return {
    startDate: formatDate(startDate.value, 'yyyy-mm-dd'),
    endDate: formatDate(endDate.value, 'yyyy-mm-dd'),
    semester: selectedSemester.value,
    mask: String(maskPrivacy.value),
  }
}

async function doExport() {
  const params = getParams()
  if (!params) return

  exporting.value = true
  resultUrl.value = ''
  try {
    const res = await export1365(params)

    if (res.result === 'error') {
      throw { error: { message: res.error || '인증서 생성 중 오류가 발생했습니다.' } }
    }

    if (res.url) {
      resultUrl.value = res.url
      window.open(res.url, '_blank')
    }
    toast.add({ severity: 'success', summary: '인증서가 생성되었습니다.', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: e.error?.message || '생성 실패', life: 3000 })
  } finally {
    exporting.value = false
  }
}

async function generateCertificate() {
  const params = getParams()
  if (!params) return

  generating.value = true
  try {
    const res = await getCertificateData(params)
    const { rows, chief } = res.data

    if (!rows.length) {
      toast.add({ severity: 'warn', summary: '해당 기간에 인증 데이터가 없습니다.', life: 3000 })
      return
    }

    const html = buildCertificateHTML(rows, chief)
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.error?.message || '인증서 생성 실패', life: 3000 })
  } finally {
    generating.value = false
  }
}

function pad4(n) {
  return String(n).padStart(4, '0')
}

function buildCertificateHTML(rows, chief) {
  const now = new Date()
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`

  let dataRowsHTML = ''
  rows.forEach((row, i) => {
    const startH = Math.floor(row.startTime / 100)
    const startM = row.startTime % 100
    const endH = startH + row.hour
    const endM = startM

    dataRowsHTML += `<tr>
      <td>${i + 1}</td>
      <td>${esc(row.volID)}</td>
      <td>${esc(row.name)}</td>
      <td>${esc(row.birthday)}</td>
      <td>${esc(row.phone)}</td>
      <td>${esc(row.date)}</td>
      <td>${pad4(startH * 100 + startM)}</td>
      <td>${pad4(endH * 100 + endM)}</td>
      <td>${row.hour}</td>
    </tr>`
  })

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>자원봉사 활동 확인서</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, 'Malgun Gothic', sans-serif; color: #000; background: #fff; }
  .container { max-width: 800px; margin: 0 auto; padding: 20px; }

  h1.title { text-align: center; font-size: 20pt; font-weight: bold; padding-bottom: 8px;
    border-bottom: 2px solid #000; margin-bottom: 12px; }

  .info-table { width: 100%; border-collapse: collapse; border-top: 1px solid #000; }
  .info-table td { border: 1px solid #000; padding: 10px 12px;
    font-weight: bold; text-align: center; vertical-align: middle; }
  .info-table .label { width: 28%; font-size: 14pt; }
  .info-table .value { font-size: 16pt; }
  .info-table tr:last-child td { border-bottom: 2px solid #000; }

  .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .data-table th { background-color: #d8d8d8; border: 1px solid #000; padding: 8px 4px;
    font-size: 11pt; font-weight: bold; text-align: center; vertical-align: middle; }
  .data-table td { border: 1px solid #000; padding: 6px 4px;
    font-size: 11pt; text-align: center; vertical-align: middle; white-space: nowrap; }

  .confirm { text-align: center; font-weight: bold; font-size: 12pt; margin-top: 24px; }

  .sign-area { position: relative; margin-top: 8px; }
  .date-line { text-align: center; font-weight: bold; font-size: 12pt; line-height: 35px; }
  .footer-line { text-align: center; font-weight: bold; font-size: 12pt; line-height: 41px; }
  .seal { position: absolute; top: 2px; right: 0; width: 106px; height: 106px; }

  .instructions { position: relative; margin-top: 24px; font-size: 10pt; font-weight: bold;
    line-height: 1.7; min-height: 140px; }
  .instructions .blue { color: #0000ff; }
  .instructions .red { color: #ff0000; text-decoration: underline; }
  .logo-instructions { position: absolute; right: 0; bottom: 0; width: 194px; height: 29px;
    display: block; }

  .evidence-title { text-align: center; font-weight: bold; font-size: 20pt;
    margin-top: 32px; padding-bottom: 8px; border-bottom: 1px solid #000; }
  .photo-table { width: 100%; border-collapse: collapse; }
  .photo-table .photo-label { background-color: #ddd9c3; border: 1px solid #000;
    padding: 4px 8px; text-align: center; font-weight: bold; font-size: 11pt; }
  .photo-table .photo-cell { border: 1px solid #000; height: 200px; }
  .logo-bottom { display: block; width: 194px; height: 31px;
    margin-top: 14px; margin-left: auto; margin-right: auto; }

  .print-bar { text-align: center; padding: 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;
    position: sticky; top: 0; z-index: 10; }
  .print-bar button { padding: 8px 20px; font-size: 14px; cursor: pointer; margin: 0 6px;
    border: 1px solid #ccc; border-radius: 4px; background: #fff; }
  .print-bar button:hover { background: #e8e8e8; }
  .print-bar .primary { background: #2563eb; color: #fff; border-color: #2563eb; }
  .print-bar .primary:hover { background: #1d4ed8; }

  @media print {
    .print-bar { display: none; }
    .container { padding: 0; max-width: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="print-bar">
  <button class="primary" onclick="window.print()">인쇄 / PDF 저장</button>
  <button onclick="window.close()">닫기</button>
</div>
<div class="container">
  <h1 class="title">자원봉사 활동 확인서</h1>

  <table class="info-table">
    <tr>
      <td class="label">활동단체명</td>
      <td class="value" colspan="8">아주대학교 고양이 동아리 미유미유</td>
    </tr>
    <tr>
      <td class="label">프로그램명<br>(활동장소)</td>
      <td class="value" colspan="8">교내 고양이 급식활동 및 급식소 주변 환경미화</td>
    </tr>
    <tr>
      <td class="label">실행계획서 제출일</td>
      <td class="value" colspan="8"></td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th>연번</th>
        <th>1365<br>아이디</th>
        <th>성  명</th>
        <th>생년월일</th>
        <th>연락처</th>
        <th>일  자</th>
        <th>시작시간</th>
        <th>종료시간</th>
        <th>봉사시간</th>
      </tr>
    </thead>
    <tbody>
      ${dataRowsHTML}
    </tbody>
  </table>

  <p class="confirm">상기와 같이 자원봉사 활동을 확인합니다.</p>

  <div class="sign-area">
    <p class="date-line">${dateStr}</p>
    <p class="footer-line">담당자 :&nbsp; ${esc(chief.name)} &nbsp;&nbsp;(서명) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 전화번호 :&nbsp; ${esc(chief.phone)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 기 관 명 :&nbsp; 아주대학교미유미유 &nbsp;&nbsp;&nbsp;&nbsp;(직인)</p>
    <img class="seal" src="/cert/seal.jpg" alt="직인">
  </div>

  <div class="instructions">
    ■ 작성요령<br>
    &nbsp;&nbsp;&nbsp;○ 봉사일자는 연도,월,일 정확히 표시(단, 1월은 01로, 7일은 07로 표시)<br>
    &nbsp;&nbsp;&nbsp;○ 시작시간은 봉사활동을 시작한 시간으로 0700 (오전 7시),1730 (오후 5시 30분)로 표시<br>
    &nbsp;&nbsp;&nbsp;○ 활동시간은 일일 봉사활동을 한 전체시간으로 3시간, 3시간30분 1일 8시간 이내로 작성<br>
    &nbsp;&nbsp;&nbsp;○ 봉사자수가 양식보다 늘어날경우 행 추가 하여 기재, 단 임의로 셀병합 합침 금지<br>
    <span class="blue">&nbsp;※ 자원봉사활동시간 인정은 활동 종료 후 <span class="red">1개월</span> 제출 원칙 (<span class="red">1개월 경과시 실적 불인정</span>)</span><br>
    <span class="blue">&nbsp;※ 1365자원봉사포털 미가입자는 자원봉사 실적 입력 불가</span>
    <img class="logo-instructions" src="/cert/logo.jpg" alt="수원시자원봉사센터">
  </div>

  <h2 class="evidence-title">자원봉사활동 주요 증빙자료</h2>
  <table class="photo-table">
    <tr><td class="photo-label" colspan="5">활동사진 1</td><td class="photo-label" colspan="4">활동사진 2</td></tr>
    <tr><td class="photo-cell" colspan="5"></td><td class="photo-cell" colspan="4"></td></tr>
    <tr><td class="photo-label" colspan="5">활동사진 3</td><td class="photo-label" colspan="4">활동사진 4</td></tr>
    <tr><td class="photo-cell" colspan="5"></td><td class="photo-cell" colspan="4"></td></tr>
    <tr><td class="photo-label" colspan="5">활동사진 5</td><td class="photo-label" colspan="4">활동사진 6</td></tr>
    <tr><td class="photo-cell" colspan="5"></td><td class="photo-cell" colspan="4"></td></tr>
  </table>
  <img class="logo-bottom" src="/cert/logo.jpg" alt="수원시자원봉사센터">
</div>
</body>
</html>`
}

function esc(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
</script>
