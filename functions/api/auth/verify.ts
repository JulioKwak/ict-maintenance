import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  try {
    const { username, password } = await request.json<{ username: string; password: string }>()
    if (!username || !password) return Response.json({ error: 'Required' }, { status: 400 })

    const row = await env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM user_passwords WHERE username = ? AND password = ?'
    ).bind(username, password).first<{ cnt: number }>()

    if (!row || row.cnt === 0) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
