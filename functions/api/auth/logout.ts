import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim()
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
  }
  return Response.json({ ok: true })
}
