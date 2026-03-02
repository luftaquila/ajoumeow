const BASE_WIDTH = 54

export function generateDotSvg(courses, width) {
  const w = width || BASE_WIDTH
  const courseColor = { 1: 'red', 2: 'gold', 3: 'limegreen' }
  const dotPosition = {
    CxCyRStrW: [25 / 54 * w, 8 / 54 * w, 1.7 / 54 * w, 1.3 / 54 * w],
    1: [25 / 54 * w],
    2: [21 / 54 * w, 29 / 54 * w],
    3: [18 / 54 * w, 25 / 54 * w, 32 / 54 * w],
  }

  let courseCount = [0, 0]
  for (const course of courses) {
    if (course.ppl.length) courseCount[0]++
  }

  let svgString = `url("data:image/svg+xml,%3Csvg width='${w}' height='${w}' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E`

  for (const course of courses) {
    const ppl = course.ppl.length
    if (!ppl) continue
    svgString +=
      `%3Ccircle cx='${dotPosition[courseCount[0]][courseCount[1]]}' cy='${dotPosition.CxCyRStrW[1]}' r='${dotPosition.CxCyRStrW[2]}' stroke='${courseColor[course.course]}' stroke-width='${dotPosition.CxCyRStrW[3]}' fill='${ppl === 1 ? 'white' : courseColor[course.course]}'%3E%3C/circle%3E`
    courseCount[1]++
  }

  svgString += `%3C/svg%3E`
  return svgString
}
