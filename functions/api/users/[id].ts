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

export const onRequestPut: PagesFunction<Env, string, Data> = async ({ request, env, params }) => {
  const id = params.id as string
  const body = await request.json<Record<string, string>>()

  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<Record<string, string>>()
  if (!row) {
    return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }

  const name = body.name ?? row.name
  const phone = body.phone ?? row.phone
  const email = body.email ?? row.email
  const role = body.role ?? row.role

  const stmts = [
    env.DB.prepare('UPDATE users SET name=?, phone=?, email=?, role=? WHERE id=?')
      .bind(name, phone, email, role, id),
  ]
  if (body.password) {
    const hashed = await hashPassword(body.password)
    stmts.push(
      env.DB.prepare('INSERT OR REPLACE INTO user_passwords (username, password) VALUES (?,?)')
        .bind(row.username, hashed)
    )
  }

  await env.DB.batch(stmts)

  return Response.json({
    id: row.id, username: row.username, name, phone, email, role, createdAt: row.created_at,
  })
}

export const onRequestDelete: PagesFunction<Env, string, Data> = async ({ env, params, data }) => {
  const id = params.id as string

  const row = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(id).first<{ username: string }>()
  if (!row) {
    return Response.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }

  if (row.username === data.username) {
    return Response.json({ error: '현재 로그인 중인 계정은 삭제할 수 없습니다.' }, { status: 400 })
  }

  await env.DB.batch([
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
    env.DB.prepare('DELETE FROM user_passwords WHERE username = ?').bind(row.username),
    env.DB.prepare('DELETE FROM sessions WHERE username = ?').bind(row.username),
  ])

  return Response.json({ ok: true })
}
