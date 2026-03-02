import { get, putJSON } from '../../../shared/api.js'

export function getData(key) {
  return get(`/data/${key}`)
}

export function updateData(key, data) {
  return putJSON(`/data/${key}`, data)
}
