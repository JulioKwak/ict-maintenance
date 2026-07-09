import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '../types'
import { authApi } from '../utils/api'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const IDLE_LIMIT_MS = 60 * 60 * 1000 // 1시간 동안 활동이 없으면 자동 로그아웃
const CHECK_INTERVAL_MS = 30 * 1000 // 유휴 여부를 확인하는 주기
const PING_INTERVAL_MS = 5 * 60 * 1000 // 활동 중일 때 서버 세션을 갱신하는 최소 간격
const ACTIVITY_KEY = 'ict_last_activity'
const EXPIRED_FLAG_KEY = 'ict_session_expired'
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authApi.getStoredUser())

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await authApi.login(username, password)
      localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
      setUser(result.user)
      return true
    } catch {
      return false
    }
  }

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  // 마운트 시(예: 새로고침, 앱 재실행) 이미 유휴 한도를 초과했다면 즉시 로그아웃 처리
  useEffect(() => {
    const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY)) || 0
    if (user && lastActivity && Date.now() - lastActivity >= IDLE_LIMIT_MS) {
      sessionStorage.setItem(EXPIRED_FLAG_KEY, '1')
      logout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 로그인 상태일 때만 사용자 활동을 추적하고, 1시간 이상 활동이 없으면 자동 로그아웃
  useEffect(() => {
    if (!user) return

    let lastActivity = Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now()
    let lastTouch = 0
    let lastPing = 0

    const recordActivity = () => {
      const now = Date.now()
      if (now - lastTouch < 3000) return // 과도한 이벤트 발생 방지(3초 스로틀)
      lastTouch = now
      lastActivity = now
      localStorage.setItem(ACTIVITY_KEY, String(now))

      if (now - lastPing > PING_INTERVAL_MS) {
        lastPing = now
        authApi.ping().catch(() => {}) // 오프라인 등 네트워크 오류는 무시
      }
    }

    const checkIdle = () => {
      if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
        sessionStorage.setItem(EXPIRED_FLAG_KEY, '1')
        logout()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkIdle()
    }

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, recordActivity, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', checkIdle)

    const intervalId = window.setInterval(checkIdle, CHECK_INTERVAL_MS)
    checkIdle() // 화면 복귀 등 재마운트 시 즉시 한 번 확인

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, recordActivity))
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', checkIdle)
      window.clearInterval(intervalId)
    }
  }, [user, logout])

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
