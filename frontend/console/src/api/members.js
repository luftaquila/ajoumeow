import { get, put, del } from '../../../shared/api.js'

export function getMembers(semester) {
  return get('/members', { semester })
}

export function searchMembers(query) {
  return get('/members/search', { query })
}

export function updateMember(studentId, data) {
  return put(`/members/${studentId}`, data)
}

export function deleteMember(studentId) {
  return del(`/members/${studentId}`)
}
