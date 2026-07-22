import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

type Row = Record<string, string | number | null>

async function getUserRole(env: Env, username: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT role FROM users WHERE username = ?').bind(username).first<{ role: string }>()
  return row?.role ?? null
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env, params }) => {
  const row = await env.DB.prepare('SELECT * FROM resource_files WHERE id = ?').bind(params.id).first<Row>()
  if (!row) return Response.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })

  const object = await env.FILES.get(params.id as string)
  if (!object) return Response.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 })

  const filename = String(row.filename)
  return new Response(object.body, {
    headers: {
      'Content-Type': String(row.content_type || 'application/octet-stream'),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': String(row.size),
    },
  })
}

export const onRequestDelete: PagesFunction<Env, string, Data> = async ({ env, params, data }) => {
  const role = await getUserRole(env, data.username ?? '')
  if (role !== 'admin') {
    return Response.json({ error: '관리자만 파일을 삭제할 수 있습니다.' }, { status: 403 })
  }

  await env.FILES.delete(params.id as string)
  await env.DB.prepare('DELETE FROM resource_files WHERE id = ?').bind(params.id).run()
  return Response.json({ ok: true })
}
