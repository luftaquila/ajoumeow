import Cookies from 'js-cookie'

const API_BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ msg: 'Network error', data: '' }))
    throw err
  }
  return res.json()
}

export function getRecords(startDate, endDate) {
  const headers = {}
  const jwt = Cookies.get('jwt')
  if (jwt) headers['jwt'] = jwt
  return request(`${API_BASE}/record?startDate=${startDate}&endDate=${endDate}`, { headers })
}

export function createRecord(data) {
  return request(`${API_BASE}/record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-access-token': Cookies.get('jwt'),
    },
    body: new URLSearchParams(data),
  })
}

export function deleteRecord(data) {
  return request(`${API_BASE}/record`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-access-token': Cookies.get('jwt'),
    },
    body: new URLSearchParams(data),
  })
}

export function login(id) {
  return request(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id }),
  })
}

export function autoLogin() {
  return request(`${API_BASE}/auth/autologin`, {
    method: 'POST',
    headers: { 'x-access-token': Cookies.get('jwt') },
  })
}

export function getSetting(name) {
  return request(`${API_BASE}/settings/${name}`)
}

export function getStatistics(type) {
  return request(`${API_BASE}/record/statistics?type=${type}`)
}

export function getMapData() {
  return request(`${API_BASE}/record/map`, {
    headers: { 'x-access-token': Cookies.get('jwt') },
  })
}

export function getWeather() {
  return fetch('/res/weather.json').then(r => r.json())
}
