/**
 * Calculate mileage score for a feeding verification.
 *
 * @param {string} date - YYYY-MM-DD
 * @param {string} course - e.g. "아침코스", "저녁코스"
 * @param {number} sameCoursePeople - how many people in same course that day (including this person)
 * @param {boolean} boost - whether boost mode is on (시험기간/연휴 등)
 * @returns {number} score
 */
export function calculateScore(date, course, sameCoursePeople, boost = false) {
  const day = new Date(date).getDay()
  const isWeekend = day === 0 || day === 6
  const isDual = sameCoursePeople >= 2

  if (boost) {
    if (isWeekend) return isDual ? 2 : 3
    return isDual ? 1.5 : 2
  }

  if (isWeekend) return isDual ? 1.5 : 2
  return isDual ? 1 : 1.5
}
