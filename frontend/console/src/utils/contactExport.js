/**
 * Generate Google Contacts CSV from registration data.
 */
export function toGoogleContactsCsv(rows) {
  const header = 'Name,Given Name,Family Name,Phone 1 - Type,Phone 1 - Value'
  const lines = rows.map(r => {
    const name = r.name || ''
    return `${name},${name},,Mobile,${r.phone || ''}`
  })
  return header + '\n' + lines.join('\n')
}

/**
 * Generate Naver Contacts CSV from registration data.
 */
export function toNaverContactsCsv(rows) {
  const header = '이름,휴대전화'
  const lines = rows.map(r => `${r.name || ''},${r.phone || ''}`)
  return header + '\n' + lines.join('\n')
}
