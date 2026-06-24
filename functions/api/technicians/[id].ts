import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPut: PagesFunction<Env, string, Data> = async ({ request, env, params }) => {
  const id = params.id as string
  const body = await request.json<Record<string, string>>()

  const row = await env.DB.prepare('SELECT * FROM technicians WHERE id = ?').bind(id).first<Record<string, string>>()
  if (!row) {
    return Response.json({ error: '기술자를 찾을 수 없습니다.' }, { status: 404 })
  }

  const name = body.name ?? row.name
  const grade = body.grade ?? row.grade
  const phone = body.phone ?? row.phone
  const email = body.email ?? row.email

  await env.DB.prepare(
    'UPDATE technicians SET name=?, grade=?, phone=?, email=? WHERE id=?'
  ).bind(name, grade, phone, email, id).run()

  return Response.json({ id, name, grade, phone, email, createdAt: row.created_at })
}

export const onRequestDelete: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  await env.DB.prepare('DELETE FROM technicians WHERE id = ?').bind(params.id).run()
  return Response.json({ ok: true })
}
