import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const { username, password } = await request.json<{ username: string; password: string }>()

  if (!username || !password) {
    return Response.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 })
  }

  const pwRow = await env.DB.prepare(
    'SELECT password FROM user_passwords WHERE username = ?'
  ).bind(username).first<{ password: string }>()

  if (!pwRow || pwRow.password !== password) {
    return Response.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const userRow = await env.DB.prepare(
    'SELECT id, username, name, phone, email, role, created_at FROM users WHERE username = ?'
  ).bind(username).first<Record<string, string>>()

  if (!userRow) {
    return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }

  // 랜덤 토큰 생성
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  const token = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')

  // 세션 저장 (7일)
  await env.DB.prepare(
    `INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, datetime('now', '+7 days'))`
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
