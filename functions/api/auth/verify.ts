import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  try {
    const { username, password } = await request.json<{ username: string; password: string }>()
    if (!username || !password) return Response.json({ error: 'Required' }, { status: 400 })

    const row = await env.DB.prepare('SELECT password FROM user_passwords WHERE username = ?')
      .bind(username).first<{ password: string }>()

    if (!row || row.password !== password) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
