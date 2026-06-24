import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function rowToUser(r: Record<string, string>) {
  return {
    id: r.id, username: r.username, name: r.name,
    phone: r.phone, email: r.email, role: r.role, createdAt: r.created_at,
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, username, name, phone, email, role, created_at FROM users ORDER BY created_at ASC'
  ).all<Record<string, string>>()

  return Response.json(results.map(rowToUser))
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const body = await request.json<Record<string, string>>()
  const { username, name, password, role } = body
  const phone = body.phone ?? ''
  const email = body.email ?? ''

  if (!username || !name || !password || !role) {
    return Response.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (existing) {
    return Response.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
  }

  const id = genId()
  const now = new Date().toISOString()

  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO users (id, username, name, phone, email, role, created_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(id, username, name, phone, email, role, now),
    env.DB.prepare(
      'INSERT OR REPLACE INTO user_passwords (username, password) VALUES (?,?)'
    ).bind(username, password),
  ])

  return Response.json({ id, username, name, phone, email, role, createdAt: now }, { status: 201 })
}
