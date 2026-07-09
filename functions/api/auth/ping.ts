import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

// 인증이 필요한 경로이므로 _middleware.ts를 통과하는 것만으로 세션 만료 시각이 갱신된다.
export const onRequestPost: PagesFunction<Env, string, Data> = async () => {
  return Response.json({ ok: true })
}
