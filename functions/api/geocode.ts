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

  // 복사/붙여넣기 과정에서 앞뒤 공백·줄바꿈이 섞여 들어갔을 가능성을 방어적으로 제거
  const clientId = env.NAVER_CLIENT_ID.trim()
  const clientSecret = env.NAVER_CLIENT_SECRET.trim()

  const naverRes = await fetch(
    `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'x-ncp-apigw-api-key-id': clientId,
        'x-ncp-apigw-api-key': clientSecret,
        'Accept': 'application/json',
      },
    }
  )

  // 네이버 쪽 응답 상태(401/403 등)를 그대로 돌려주면 프론트엔드가 "우리 서비스 로그인 세션 만료"로
  // 오인해 강제 로그아웃시키므로, 업스트림 실패는 항상 502로 통일하고 실제 원인은 본문에만 담는다.
  if (!naverRes.ok) {
    const rawBody = await naverRes.text()
    return Response.json(
      { error: `네이버 지도 API 호출에 실패했습니다. (HTTP ${naverRes.status}) ${rawBody.slice(0, 300)}` },
      { status: 502 }
    )
  }

  const data = await naverRes.json<NaverGeocodeResponse>()

  if (data.status !== 'OK') {
    return Response.json(
      { error: data.errorMessage || `주소 검색에 실패했습니다. (status: ${data.status})` },
      { status: 502 }
    )
  }

  return Response.json({ addresses: data.addresses })
}
