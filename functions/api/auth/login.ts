import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

const ITERATIONS = 100_000

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  const toHex = (buf: Uint8Array) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`
}

async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (!stored.includes(':') || stored.length < 60) {
    return input === stored
  }
  const [saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(input), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === hashHex
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const { username, password } = await request.json<{ username: string; password: string }>()

  if (!username || !password) {
    return Response.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 })
  }

  const pwRow = await env.DB.prepare(
    'SELECT password FROM user_passwords WHERE username = ?'
  ).bind(username).first<{ password: string }>()

  if (!pwRow) {
    return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const valid = await verifyPassword(password, pwRow.password)
  if (!valid) {
    return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  // 평문 비밀번호를 해시로 자동 마이그레이션
  if (!pwRow.password.includes(':') || pwRow.password.length < 60) {
    const hashed = await hashPassword(password)
    await env.DB.prepare('UPDATE user_passwords SET password = ? WHERE username = ?')
      .bind(hashed, username).run()
  }

  const userRow = await env.DB.prepare(
    'SELECT id, username, name, phone, email, role, created_at FROM users WHERE username = ?'
  ).bind(username).first<Record<string, string>>()

  if (!userRow) {
    return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }

  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  const token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')

  // 활동이 없으면 1시간 후 만료 (요청이 있을 때마다 _middleware.ts에서 갱신됨)
  await env.DB.prepare(
    `INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, datetime('now', '+1 hour'))`
  ).bind(token, username).run()

  return Response.json({
    token,
    user: {
      id: userRow.id,
      username: userRow.username,
      name: userRow.name,
      phone: userRow.phone,
      email: userRow.email,
      role: userRow.role,
      createdAt: userRow.created_at,
    },
  })
}
