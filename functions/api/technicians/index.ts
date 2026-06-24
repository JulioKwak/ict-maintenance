import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function rowToTech(r: Record<string, string>) {
  return {
    id: r.id, name: r.name, grade: r.grade,
    phone: r.phone, email: r.email, createdAt: r.created_at,
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM technicians ORDER BY created_at ASC'
  ).all<Record<string, string>>()

  return Response.json(results.map(rowToTech))
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const body = await request.json<Record<string, string>>()
  const { name, grade } = body
  const phone = body.phone ?? ''
  const email = body.email ?? ''

  if (!name || !grade) {
    return Response.json({ error: '이름과 등급은 필수입니다.' }, { status: 400 })
  }

  const id = genId()
  const now = new Date().toISOString()

  await env.DB.prepare(
    'INSERT INTO technicians (id, name, grade, phone, email, created_at) VALUES (?,?,?,?,?,?)'
  ).bind(id, name, grade, phone, email, now).run()

  return Response.json({ id, name, grade, phone, email, createdAt: now }, { status: 201 })
}
