import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type Row = Record<string, string | number | null>

// Workers 런타임의 FormData.get()은 실제로 File을 반환할 수 있지만, 이 프로젝트의
// 앰비언트 타입 설정에서는 string | null로만 잡혀 File 관련 필드가 보이지 않아 직접 선언한다.
interface UploadedFile {
  name: string
  size: number
  type: string
  arrayBuffer(): Promise<ArrayBuffer>
}

function rowToResource(r: Row) {
  return {
    id: r.id,
    filename: r.filename,
    size: r.size,
    contentType: r.content_type,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
  }
}

async function getUserRole(env: Env, username: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT role FROM users WHERE username = ?').bind(username).first<{ role: string }>()
  return row?.role ?? null
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM resource_files ORDER BY created_at DESC'
  ).all<Row>()

  return Response.json(results.map(rowToResource))
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env, data }) => {
  const role = await getUserRole(env, data.username ?? '')
  if (role !== 'admin') {
    return Response.json({ error: '관리자만 파일을 업로드할 수 있습니다.' }, { status: 403 })
  }

  const form = await request.formData()
  const filePart = form.get('file')
  if (!filePart || typeof filePart === 'string') {
    return Response.json({ error: '파일이 필요합니다.' }, { status: 400 })
  }
  const file = filePart as unknown as UploadedFile

  const id = genId()
  const now = new Date().toISOString()

  await env.FILES.put(id, await file.arrayBuffer())
  await env.DB.prepare(`
    INSERT INTO resource_files (id, filename, size, content_type, uploaded_by, created_at)
    VALUES (?,?,?,?,?,?)
  `).bind(id, file.name, file.size, file.type || 'application/octet-stream', data.username ?? '', now).run()

  return Response.json({
    id, filename: file.name, size: file.size, contentType: file.type || 'application/octet-stream',
    uploadedBy: data.username ?? '', createdAt: now,
  }, { status: 201 })
}
