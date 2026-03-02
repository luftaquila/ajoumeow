import { post } from '../../../shared/api.js'

export function autoLogin() {
  return post('/auth/refresh')
}
