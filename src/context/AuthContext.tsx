import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { getUsers, saveUsers } from '../utils/storage'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  name: '관리자',
  phone: '010-0000-0000',
  email: 'admin@example.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
}

const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin': 'admin1234',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 초기 admin 계정 생성
    const users = getUsers()
    if (users.length === 0) {
      saveUsers([DEFAULT_ADMIN])
      localStorage.setItem('ict_passwords', JSON.stringify(DEFAULT_PASSWORDS))
    }
    // 세션 복원
    const savedUser = localStorage.getItem('ict_current_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('ict_current_user')
      }
    }
  }, [])

  const login = (username: string, password: string): boolean => {
    const passwords = JSON.parse(localStorage.getItem('ict_passwords') || '{}') as Record<string, string>
    if (passwords[username] !== password) return false
    const users = getUsers()
    const found = users.find(u => u.username === username)
    if (!found) return false
    setUser(found)
    localStorage.setItem('ict_current_user', JSON.stringify(found))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ict_current_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
