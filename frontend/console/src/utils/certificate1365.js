// Builds the 1365 volunteer certificate (자원봉사 활동 확인서) as an xlsx workbook.
// Column widths, row heights, merges and fills are taken from the original
// 수원시자원봉사센터 form (자원봉사_활동확인서_대량.xls).

const FONT = '맑은 고딕'

const BLACK = 'FF000000'
const BLUE = 'FF0000FF'
const RED = 'FFFF0000'
const HEADER_FILL = 'FFC0C0C0'
const PHOTO_FILL = 'FFFFFF99'

const THIN = { style: 'thin', color: { argb: BLACK } }
const MEDIUM = { style: 'medium', color: { argb: BLACK } }
const BOX = { top: THIN, left: THIN, bottom: THIN, right: THIN }

// Column widths in characters, plus their pixel widths used for image anchoring.
const COL_WIDTHS = [3.17, 13.83, 10.17, 9, 13.33, 13.83, 13.83, 13.83, 11.67]
const COL_PIXELS = [24, 88, 66, 59, 85, 88, 88, 88, 75]
const SHEET_WIDTH = COL_PIXELS.reduce((a, b) => a + b, 0)

// Seal / logo image sizes in pixels, as placed on the original form.
const SEAL = { width: 106, height: 106 }
const LOGO = { width: 194, height: 29 }

const HEADERS = ['연번', '1365\n아이디', '성  명', '생년월일', '연락처', '일  자', '시작시간', '종료시간', '봉사시간']

const INSTRUCTION_HEAD =
  '■ 작성요령\n' +
  '   ○ 봉사일자는 연도,월,일 정확히 표시(단, 1월은 01로, 7일은 07로 표시)\n' +
  '   ○ 시작시간은 봉사활동을 시작한 시간으로 0700 (오전 7시),1730 (오후 5시 30분)로 표시\n' +
  '   ○ 활동시간은 일일 봉사활동을 한 전체시간으로 3시간, 3시간30분 1일 8시간 이내로 작성\n' +
  '   ○ 봉사자수가 양식보다 늘어날경우 행 추가 하여 기재, 단 임의로 셀병합 합침 금지\n'

const PX_PER_PT = 4 / 3
const EMU_PER_PX = 9525

// Height of the 작성요령 block in points; also used to pin the logo to its bottom right.
const NOTE_HEIGHT = 129.75

function pad4(n) {
  return String(n).padStart(4, '0')
}

// Image anchor. ExcelJS converts fractional col/row anchors with a wrong EMU factor,
// so give it native offsets instead. x is pixels from the left edge of the sheet,
// row is 1-based and y is the pixel offset within that row.
function anchor(x, row, y) {
  let col = 0
  let left = 0
  while (col < COL_PIXELS.length - 1 && x >= left + COL_PIXELS[col]) {
    left += COL_PIXELS[col]
    col++
  }
  return {
    nativeCol: col,
    nativeColOff: Math.round((x - left) * EMU_PER_PX),
    nativeRow: row - 1,
    nativeRowOff: Math.round(y * EMU_PER_PX),
  }
}

function applyRange(ws, range, style) {
  const [from, to] = range.split(':')
  const start = ws.getCell(from)
  const end = ws.getCell(to || from)
  for (let r = start.row; r <= end.row; r++) {
    for (let c = start.col; c <= end.col; c++) {
      Object.assign(ws.getCell(r, c), style)
    }
  }
}

function writeMerged(ws, range, value, style) {
  ws.mergeCells(range)
  applyRange(ws, range, style)
  ws.getCell(range.split(':')[0]).value = value
}

function fill(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } }
}

/**
 * Build the 1365 certificate workbook.
 *
 * @param {Array} rows - rows from GET /verifications/1365-data
 * @param {{name: string, phone: string}} chief - 담당자 (회장)
 * @param {{ExcelJS: object, seal: ArrayBuffer, logo: ArrayBuffer}} deps - ExcelJS module and form images
 * @returns {object} ExcelJS Workbook
 */
export function buildCertificateWorkbook(rows, chief, { ExcelJS, seal, logo }) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
  })

  // ExcelJS treats width 9 as the default and omits it (column D), so pin the default to 9.
  ws.properties.defaultColWidth = 9
  COL_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w })

  const center = { vertical: 'middle', horizontal: 'center', wrapText: true }

  // Title
  writeMerged(ws, 'A1:I1', '자원봉사 활동 확인서', {
    font: { name: FONT, size: 20, bold: true },
    alignment: center,
    border: { bottom: MEDIUM },
  })
  ws.getRow(2).height = 9

  // Activity info table
  const info = [
    ['활동단체명', '아주대학교 고양이 동아리 미유미유'],
    ['프로그램명\n(활동장소)', '교내 고양이 급식활동 및 급식소 주변 환경미화'],
    ['실행계획서 제출일', ''],
  ]
  info.forEach(([label, value], i) => {
    const r = 3 + i
    const last = i === info.length - 1
    const border = last ? { ...BOX, bottom: MEDIUM } : BOX
    ws.getRow(r).height = 36.75
    writeMerged(ws, `A${r}:C${r}`, label, { font: { name: FONT, size: 14, bold: true }, alignment: center, border })
    writeMerged(ws, `D${r}:I${r}`, value, { font: { name: FONT, size: 16, bold: true }, alignment: center, border })
  })

  // Data table header
  const headRow = ws.getRow(7)
  headRow.height = 32.25
  HEADERS.forEach((h, i) => {
    Object.assign(headRow.getCell(i + 1), {
      value: h,
      font: { name: FONT, size: 11, bold: true },
      alignment: center,
      border: BOX,
      fill: fill(HEADER_FILL),
    })
  })

  // Data rows
  rows.forEach((row, i) => {
    const startH = Math.floor(row.startTime / 100)
    const startM = row.startTime % 100
    const line = ws.getRow(8 + i)
    line.height = 22.5
    const values = [
      i + 1,
      row.volID,
      row.name,
      row.birthday || '',
      row.phone || '',
      row.date,
      pad4(startH * 100 + startM),
      pad4((startH + row.hour) * 100 + startM),
      `${row.hour}시간`,
    ]
    values.forEach((v, c) => {
      Object.assign(line.getCell(c + 1), {
        value: v,
        font: { name: FONT, size: 11 },
        alignment: center,
        border: BOX,
      })
    })
  })

  let r = 8 + rows.length
  const bold12 = { font: { name: FONT, size: 12, bold: true }, alignment: center }

  ws.getRow(r).height = 34.5
  writeMerged(ws, `A${r}:I${r}`, '상기와 같이 자원봉사 활동을 확인합니다. ', bold12)

  const now = new Date()
  const dateRow = ++r
  ws.getRow(dateRow).height = 27
  writeMerged(ws, `A${dateRow}:I${dateRow}`, `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`, bold12)

  r++
  ws.getRow(r).height = 31.5
  writeMerged(
    ws,
    `A${r}:I${r}`,
    `담당자 :  ${chief.name || ''}  (서명)        전화번호 :  ${chief.phone || ''}        기 관 명 :  아주대학교미유미유    (직인) `,
    bold12,
  )

  // 작성요령 (instructions)
  const noteRow = ++r
  ws.getRow(noteRow).height = NOTE_HEIGHT
  const noteFont = { name: FONT, size: 10, bold: true }
  writeMerged(ws, `A${noteRow}:I${noteRow}`, {
    richText: [
      { font: { ...noteFont, color: { argb: BLACK } }, text: INSTRUCTION_HEAD },
      { font: { ...noteFont, color: { argb: BLUE } }, text: ' ※ 자원봉사활동시간 인정은 활동 종료 후 ' },
      { font: { ...noteFont, color: { argb: RED }, underline: true }, text: '1개월' },
      { font: { ...noteFont, color: { argb: BLUE } }, text: ' 제출 원칙 (' },
      { font: { ...noteFont, color: { argb: RED }, underline: true }, text: '1개월 경과시 실적 불인정' },
      { font: { ...noteFont, color: { argb: BLUE } }, text: ')\n ※ 1365자원봉사포털 미가입자는 자원봉사 실적 입력 불가' },
    ],
  }, { font: noteFont, alignment: { vertical: 'top', horizontal: 'left', wrapText: true } })

  r++ // spacer

  // Evidence section
  const evidenceRow = ++r
  ws.getRow(evidenceRow).height = 40.5
  writeMerged(ws, `A${evidenceRow}:I${evidenceRow}`, '자원봉사활동 주요 증빙자료', {
    font: { name: FONT, size: 20, bold: true },
    alignment: center,
    border: { bottom: THIN },
  })

  const photoLabel = { font: { name: FONT, size: 11, bold: true }, alignment: center, border: BOX, fill: fill(PHOTO_FILL) }
  const photoCell = { border: BOX }
  const photoHeights = [[17.25, 155.25], [18.75, 166.5], [18.75, 166.5]]
  photoHeights.forEach(([labelHeight, cellHeight], i) => {
    const lr = ++r
    ws.getRow(lr).height = labelHeight
    writeMerged(ws, `A${lr}:E${lr}`, `활동사진 ${i * 2 + 1}`, photoLabel)
    writeMerged(ws, `F${lr}:I${lr}`, `활동사진 ${i * 2 + 2}`, photoLabel)

    const cr = ++r
    ws.getRow(cr).height = cellHeight
    writeMerged(ws, `A${cr}:E${cr}`, null, photoCell)
    writeMerged(ws, `F${cr}:I${cr}`, null, photoCell)
  })

  // Bottom logo row
  const logoRow = ++r
  ws.getRow(logoRow).height = LOGO.height / PX_PER_PT

  // Seal, at the right end of the signature line
  const sealId = wb.addImage({ buffer: seal, extension: 'jpeg' })
  ws.addImage(sealId, { tl: anchor(SHEET_WIDTH - SEAL.width, dateRow, 2), ext: SEAL })

  // 수원시자원봉사센터 logo, bottom right of the instructions block
  const logoId = wb.addImage({ buffer: logo, extension: 'jpeg' })
  ws.addImage(logoId, {
    tl: anchor(SHEET_WIDTH - LOGO.width, noteRow, NOTE_HEIGHT * PX_PER_PT - LOGO.height),
    ext: LOGO,
  })

  // Same logo again, centered under the evidence table
  ws.addImage(logoId, { tl: anchor((SHEET_WIDTH - LOGO.width) / 2, logoRow, 0), ext: LOGO })

  return wb
}
