import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  try {
    const { username, password } = await request.json<{ username: string; password: string }>()

    const row = await env.DB.prepare(
      'SELECT password FROM user_passwords WHERE username = ?'
    ).bind(username).first<{ password: string }>()

    if (!row) {
      return Response.json({ error: 'no_row', username, v: 'dbg1' }, { status: 401 })
    }

    return Response.json({
      v: 'dbg1',
      stored_len: row.password.length,
      stored_hex: Array.from(new TextEncoder().encode(row.password)).map(b => b.toString(16).padStart(2,'0')).join(' '),
      input_len: password.length,
      input_hex: Array.from(new TextEncoder().encode(password)).map(b => b.toString(16).padStart(2,'0')).join(' '),
      match: row.password === password,
    }, { status: 401 })
  } catch (e) {
    return Response.json({ error: String(e), v: 'dbg1' }, { status: 500 })
  }
}
