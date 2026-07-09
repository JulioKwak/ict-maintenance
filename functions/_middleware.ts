import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from './_types'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

export const onRequest: PagesFunction<Env, string, Data> = async (ctx) => {
  const { request, env, data } = ctx

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  const url = new URL(request.url)
  const isApiPath = url.pathname.startsWith('/api/')
  const isPublicPath = url.pathname === '/api/auth/login' || url.pathname === '/api/auth/verify'

  if (isApiPath && !isPublicPath) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim() ?? ''

    if (!token) {
      return Response.json({ error: '인증이 필요합니다.' }, { status: 401, headers: CORS })
    }

    const session = await env.DB.prepare(
      `SELECT username FROM sessions WHERE token = ? AND expires_at > datetime('now')`
    ).bind(token).first<{ username: string }>()

    if (!session) {
      return Response.json({ error: '세션이 만료되었습니다.' }, { status: 401, headers: CORS })
    }

    data.username = session.username

    // 요청(활동)이 있을 때마다 만료 시각을 1시간 뒤로 연장 (유휴 타임아웃)
    await env.DB.prepare(
      `UPDATE sessions SET expires_at = datetime('now', '+1 hour') WHERE token = ?`
    ).bind(token).run()
  }

  const res = await ctx.next()
  const newRes = new Response(res.body, res)
  Object.entries(CORS).forEach(([k, v]) => newRes.headers.set(k, v))
  return newRes
}
