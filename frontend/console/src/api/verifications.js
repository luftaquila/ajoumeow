import { get, postJSON, del } from '../../../shared/api.js'

export function getVerifications(date) {
  return get('/verifications', { date })
}

export function createVerifications(items) {
  return postJSON('/verifications', { items })
}

export function deleteVerifications(items) {
  return del('/verifications', { items })
}

export function getLatestVerification() {
  return get('/verifications/latest')
}

export function export1365(params) {
  return get('/verifications/1365-export', params)
}
