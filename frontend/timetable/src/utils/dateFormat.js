const token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g
const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g
const timezoneClip = /[^-+\dA-Z]/g

function pad(val, len) {
  val = String(val)
  len = len || 2
  while (val.length < len) val = '0' + val
  return val
}

const masks = { default: 'ddd mmm dd yyyy HH:MM:ss' }
const i18n = {
  dayNames: [
    '일', '월', '화', '수', '목', '금', '토',
    '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일',
  ],
  monthNames: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  ],
}

export function formatLocal(utcStr, mask = 'yyyy-mm-dd HH:MM:ss') {
  if (!utcStr) return ''
  return formatDate(new Date(utcStr.replace(' ', 'T') + 'Z'), mask)
}

export function formatDate(date, mask, utc) {
  if (arguments.length === 1 && typeof date === 'string' && !/\d/.test(date)) {
    mask = date
    date = undefined
  }
  date = date ? new Date(date) : new Date()
  if (isNaN(date)) throw SyntaxError('invalid date')

  mask = String(masks[mask] || mask || masks['default'])
  if (mask.slice(0, 4) === 'UTC:') {
    mask = mask.slice(4)
    utc = true
  }

  const _ = utc ? 'getUTC' : 'get'
  const d = date[_ + 'Date']()
  const D = date[_ + 'Day']()
  const m = date[_ + 'Month']()
  const y = date[_ + 'FullYear']()
  const H = date[_ + 'Hours']()
  const M = date[_ + 'Minutes']()
  const s = date[_ + 'Seconds']()
  const L = date[_ + 'Milliseconds']()
  const o = utc ? 0 : date.getTimezoneOffset()
  const flags = {
    d,
    dd: pad(d),
    ddd: i18n.dayNames[D],
    dddd: i18n.dayNames[D + 7],
    m: m + 1,
    mm: pad(m + 1),
    mmm: i18n.monthNames[m],
    mmmm: i18n.monthNames[m + 12],
    yy: String(y).slice(2),
    yyyy: y,
    h: H % 12 || 12,
    hh: pad(H % 12 || 12),
    H,
    HH: pad(H),
    M,
    MM: pad(M),
    s,
    ss: pad(s),
    l: pad(L, 3),
    L: pad(L > 99 ? Math.round(L / 10) : L),
    t: H < 12 ? 'a' : 'p',
    tt: H < 12 ? 'am' : 'pm',
    T: H < 12 ? 'A' : 'P',
    TT: H < 12 ? '오전' : '오후',
    Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
    o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + (Math.abs(o) % 60), 4),
    S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : ((d % 100 - d % 10 !== 10) * d) % 10],
  }
  return mask.replace(token, ($0) => ($0 in flags ? flags[$0] : $0.slice(1, $0.length - 1)))
}

export function getDayNum(date) {
  return date.getDay() ? date.getDay() : 7
}

export function getDateFromCalendarStart(plusdate) {
  const d = new Date()
  return formatDate(new Date(Date.now() - (getDayNum(d) + 7 - plusdate) * 24 * 3600000), 'yyyy-mm-dd')
}
