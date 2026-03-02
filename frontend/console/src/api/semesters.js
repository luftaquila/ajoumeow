import { get } from '../../../shared/api.js'

export function getSemesters() {
  return get('/semesters')
}
