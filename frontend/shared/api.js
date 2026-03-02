import Cookies from 'js-cookie'

const API_BASE = '/api'

export function authHeader() {
  const jwt = Cookies.get('jwt')
  return jwt ? { 'Authorization': 'Bearer ' + jwt } : {}
}

export async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Network error', code: '' } }))
    throw err
  }
  return res.json()
}

export function get(path, params) {
  const url = params
    ? `${API_BASE}${path}?${new URLSearchParams(params)}`
    : `${API_BASE}${path}`
  return request(url, { headers: authHeader() })
}

export function post(path, data) {
  return request(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...authHeader(),
    },
    body: new URLSearchParams(data),
  })
}

export function postJSON(path, data) {
  return request(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(data),
  })
}

export function put(path, data) {
  return request(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...authHeader(),
    },
    body: new URLSearchParams(data),
  })
}

export function del(path, data) {
  if (data) {
    return request(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify(data),
    })
  }
  return request(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
}
