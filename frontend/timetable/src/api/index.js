import Cookies from 'js-cookie'

const API_BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Network error', code: '' } }))
    throw err
  }
  return res.json()
}

function authHeader() {
  const jwt = Cookies.get('jwt')
  return jwt ? { 'Authorization': 'Bearer ' + jwt } : {}
}

export function getRecords(startDate, endDate) {
  return request(`${API_BASE}/records?startDate=${startDate}&endDate=${endDate}`, {
    headers: authHeader(),
  })
}

export function createRecord(data) {
  return request(`${API_BASE}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...authHeader(),
    },
    body: new URLSearchParams(data),
  })
}

export function deleteRecord(id) {
  return request(`${API_BASE}/records/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
}

export function login(studentId) {
  return request(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ studentId }),
  })
}

export function autoLogin() {
  return request(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: authHeader(),
  })
}

export function getSetting(name) {
  return request(`${API_BASE}/settings/${name}`)
}

export function getWeather() {
  return fetch('/api/data/weather').then(r => r.json())
}
