import { get } from '../../../shared/api.js'

export function getRegistrations(semester) {
  return get('/registrations', { semester })
}

export function getRegistrationSemesters() {
  return get('/registrations/semesters')
}
