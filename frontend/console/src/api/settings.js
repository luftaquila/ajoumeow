import { get, put } from '../../../shared/api.js'

export function getSetting(key) {
  return get(`/settings/${key}`)
}

export function updateSetting(key, value) {
  return put(`/settings/${key}`, { value })
}
