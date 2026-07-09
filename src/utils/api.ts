import type { User, Technician, Building, InspectionForm } from '../types'

const BASE = '/api'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getToken(): string {
  return localStorage.getItem('ict_token') ?? ''
}

function clearSession(): void {
  localStorage.removeItem('ict_token')
  localStorage.removeItem('ict_current_user')
  localStorage.removeItem('ict_last_activity')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...(options?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    const hadToken = !!getToken()
    clearSession()
    // 로그인 시도 자체의 실패(아이디/비밀번호 오류)가 아니라 세션이 무효화된 경우에만 안내 문구 표시
    if (hadToken && path !== '/auth/login') {
      sessionStorage.setItem('ict_session_expired', '1')
    }
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '오류가 발생했습니다.' })) as { error: string }
    throw new Error(err.error)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }

  return res.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const result = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem('ict_token', result.token)
    localStorage.setItem('ict_current_user', JSON.stringify(result.user))
    return result
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
  },

  getStoredUser(): User | null {
    try {
      const s = localStorage.getItem('ict_current_user')
      return s ? (JSON.parse(s) as User) : null
    } catch {
      return null
    }
  },

  async verifyPassword(username: string, password: string): Promise<boolean> {
    const res = await fetch(`${BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return res.ok
  },

  // 사용자 활동이 있을 때 호출해 서버 세션의 유휴 만료 시각을 연장한다.
  async ping(): Promise<void> {
    await request('/auth/ping', { method: 'POST' })
  },
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: () => request<User[]>('/users'),

  create: (data: Omit<User, 'id' | 'createdAt'> & { password: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),
}

// ─── Technicians ──────────────────────────────────────────────────────────────

export const techniciansApi = {
  getAll: () => request<Technician[]>('/technicians'),

  create: (data: Omit<Technician, 'id' | 'createdAt'>) =>
    request<Technician>('/technicians', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Technician>) =>
    request<Technician>(`/technicians/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/technicians/${id}`, { method: 'DELETE' }),
}

// ─── Buildings ────────────────────────────────────────────────────────────────

export const buildingsApi = {
  getAll: () => request<Building[]>('/buildings'),

  getById: (id: string) => request<Building>(`/buildings/${id}`),

  create: (data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Building>('/buildings', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Building>) =>
    request<Building>(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/buildings/${id}`, { method: 'DELETE' }),
}

// ─── Inspections ──────────────────────────────────────────────────────────────

export const inspectionsApi = {
  getAll: () => request<InspectionForm[]>('/inspections'),

  getByBuilding: (buildingId: string) =>
    request<InspectionForm[]>(`/inspections?buildingId=${buildingId}`),

  create: (data: Omit<InspectionForm, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<InspectionForm>('/inspections', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<InspectionForm>) =>
    request<InspectionForm>(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/inspections/${id}`, { method: 'DELETE' }),
}
