import { get, putJSON, del } from '../../../shared/api.js'

export function getMembers(semester) {
  return get('/members', { semester })
}

export function searchMembers(query) {
  return get('/members/search', { query })
}

export function getRoles() {
  return get('/members/roles')
}

// JSON body keeps null fields as null (form encoding turns them into the string 'null')
export function updateMember(studentId, data) {
  return putJSON(`/members/${studentId}`, data)
}

export function deleteMember(studentId, semester) {
  return del(`/members/${studentId}`, { semester })
}
