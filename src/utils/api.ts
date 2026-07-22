import type { User, Technician, Building, InspectionForm, WageRateSet, CompanyInfo, TechnicianGrade, ResourceFile } from '../types'

const BASE = '/api'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getToken(): string {
  return localStorage.getItem('ict_token') ?? ''
}

function clearSession(): void {
  localStorage.removeItem('ict_token')
  localStorage.removeItem('ict_current_user')
  localStorage.removeItem('ict_last_activity')
}

// 401/에러 응답 공통 처리 (세션 만료 리다이렉트, 에러 메시지 파싱). JSON 파싱 여부는 호출부에서 결정.
async function checkResponse(res: Response, path: string): Promise<void> {
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

  await checkResponse(res, path)

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }

  return res.json() as Promise<T>
}

// FormData 업로드용: request()와 달리 Content-Type을 강제하지 않는다(브라우저가 multipart 경계를 자동 설정).
async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData,
  })
  await checkResponse(res, path)
  return res.json() as Promise<T>
}

// 파일 다운로드용: JSON이 아닌 Blob 응답을 받아 브라우저에 즉시 저장한다.
async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  })
  await checkResponse(res, path)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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

// ─── Wage rates ───────────────────────────────────────────────────────────────

export const wageRatesApi = {
  getAll: () => request<WageRateSet[]>('/wage-rates'),

  upsert: (year: number, rates: Record<TechnicianGrade, number>) =>
    request<WageRateSet>(`/wage-rates/${year}`, { method: 'PUT', body: JSON.stringify({ rates }) }),

  delete: (year: number) =>
    request<void>(`/wage-rates/${year}`, { method: 'DELETE' }),
}

// ─── Company ──────────────────────────────────────────────────────────────────

export const companyApi = {
  get: () => request<CompanyInfo>('/company'),

  update: (data: Partial<CompanyInfo>) =>
    request<CompanyInfo>('/company', { method: 'PUT', body: JSON.stringify(data) }),
}

// ─── Geocoding (네이버 지도 주소 검색) ──────────────────────────────────────────

export interface NaverAddress {
  roadAddress: string
  jibunAddress: string
  englishAddress: string
  x: string
  y: string
}

export const geocodeApi = {
  search: (query: string) =>
    request<{ addresses: NaverAddress[] }>(`/geocode?query=${encodeURIComponent(query)}`)
      .then(res => res.addresses),
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

// ─── 자료실 ────────────────────────────────────────────────────────────────────

export const resourcesApi = {
  getAll: () => request<ResourceFile[]>('/resources'),

  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadFile<ResourceFile>('/resources', formData)
  },

  download: (file: ResourceFile) => downloadFile(`/resources/${file.id}`, file.filename),

  delete: (id: string) =>
    request<void>(`/resources/${id}`, { method: 'DELETE' }),
}
