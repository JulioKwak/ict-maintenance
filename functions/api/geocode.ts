import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../_types'

interface NaverGeocodeResponse {
  status: string
  errorMessage?: string
  addresses: {
    roadAddress: string
    jibunAddress: string
    englishAddress: string
    x: string
    y: string
  }[]
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('query')?.trim()

  if (!query) {
    return Response.json({ error: '검색어를 입력하세요.' }, { status: 400 })
  }

  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
    return Response.json(
      { error: '네이버 지도 API 키가 설정되지 않았습니다. Cloudflare 대시보드에서 NAVER_CLIENT_ID/NAVER_CLIENT_SECRET을 설정해주세요.' },
      { status: 500 }
    )
  }

  const naverRes = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'x-ncp-apigw-api-key-id': env.NAVER_CLIENT_ID,
        'x-ncp-apigw-api-key': env.NAVER_CLIENT_SECRET,
        'Accept': 'application/json',
      },
    }
  )

  const data = await naverRes.json<NaverGeocodeResponse>()

  if (!naverRes.ok || data.status !== 'OK') {
    return Response.json(
      { error: data.errorMessage || `주소 검색에 실패했습니다. (${naverRes.status})` },
      { status: naverRes.ok ? 502 : naverRes.status }
    )
  }

  return Response.json({ addresses: data.addresses })
}
