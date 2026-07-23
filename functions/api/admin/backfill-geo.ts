import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

interface NaverGeocodeResponse {
  status: string
  addresses: {
    x: string
    y: string
    addressElements: { types: string[]; longName: string }[]
  }[]
}

async function getUserRole(env: Env, username: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT role FROM users WHERE username = ?').bind(username).first<{ role: string }>()
  return row?.role ?? null
}

// 기존에 좌표 없이 저장된 건축물 주소를 Geocoding으로 일괄 변환해 latitude/longitude/sido를 채운다.
// 주소 검색 기능에 위경도·시도 저장이 추가되기 전(이전) 데이터를 한 번 보정하는 관리자 전용 도구다.
export const onRequestPost: PagesFunction<Env, string, Data> = async ({ env, data }) => {
  const role = await getUserRole(env, data.username ?? '')
  if (role !== 'admin') {
    return Response.json({ error: '관리자만 실행할 수 있습니다.' }, { status: 403 })
  }

  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    return Response.json({ error: '네이버 지도 API 키가 설정되지 않았습니다.' }, { status: 500 })
  }

  const clientId = env.NAVER_CLIENT_ID.trim()
  const clientSecret = env.NAVER_CLIENT_SECRET.trim()

  const { results } = await env.DB.prepare(
    `SELECT id, address FROM buildings WHERE latitude IS NULL OR longitude IS NULL OR sido IS NULL`
  ).all<{ id: string; address: string }>()

  const failed: { id: string; address: string }[] = []
  let updated = 0

  for (const row of results) {
    try {
      const res = await fetch(
        `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(row.address)}&count=1`,
        {
          headers: {
            'x-ncp-apigw-api-key-id': clientId,
            'x-ncp-apigw-api-key': clientSecret,
            'Accept': 'application/json',
          },
        }
      )
      if (!res.ok) { failed.push(row); continue }
      const data = await res.json<NaverGeocodeResponse>()
      const match = data.status === 'OK' ? data.addresses[0] : undefined
      if (!match) { failed.push(row); continue }

      const sido = match.addressElements.find(el => el.types.includes('SIDO'))?.longName ?? ''
      await env.DB.prepare('UPDATE buildings SET latitude = ?, longitude = ?, sido = ? WHERE id = ?')
        .bind(Number(match.y), Number(match.x), sido || null, row.id)
        .run()
      updated++
    } catch {
      failed.push(row)
    }
  }

  return Response.json({ total: results.length, updated, failed })
}
