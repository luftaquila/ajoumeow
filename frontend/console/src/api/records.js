import { put } from '../../../shared/api.js'

export function changeRecordMember(id, studentId) {
  return put(`/records/${id}`, { studentId })
}
