import type { UserRole } from '../types'

const ROLE_ALLOWED_PATHS: Record<UserRole, string[] | 'all'> = {
  admin: 'all',
  reviewer: 'all',
  inspector: ['/my-inspections', '/inspection'],
}

export function canAccessPath(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false
  const allowed = ROLE_ALLOWED_PATHS[role]
  if (allowed === 'all') return true
  return allowed.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function homePathForRole(role: UserRole | undefined): string {
  return role === 'inspector' ? '/my-inspections' : '/dashboard'
}

export function canDelete(role: UserRole | undefined): boolean {
  return role === 'admin'
}

export function canEditSystemSettings(role: UserRole | undefined): boolean {
  return role === 'admin'
}
