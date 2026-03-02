import { get, postJSON } from '../../../shared/api.js'

export function getSemesters() {
  return get('/semesters')
}

export function previewTransition(name) {
  return get('/semesters/transition/preview', { name })
}

export function executeTransition(name) {
  return postJSON('/semesters/transition', { name })
}
