import { get, putJSON } from '../../../shared/api.js'

export function getApplications(semester, status) {
  const params = {}
  if (semester) params.semester = semester
  if (status && status !== 'all') params.status = status
  return get('/applications', params)
}

export function getApplicationSemesters() {
  return get('/applications/semesters')
}

export function approveApplication(id) {
  return putJSON(`/applications/${id}/approve`)
}

export function rejectApplication(id) {
  return putJSON(`/applications/${id}/reject`)
}
