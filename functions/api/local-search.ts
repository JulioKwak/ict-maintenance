import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../_types'

interface NaverLocalSearchResponse {
  total: number
  start: number
  display: number
  items: {
    title: string
    category: string
    address: string
    roadAddress: string
    mapx: string
    mapy: string
  }[]
}

const PAGE_SIZE = 5

// 네이버 지역 검색 API는 검색어와 일치한 부분을 <b>태그로 감싸고 특수문자를 HTML 엔티티로 인코딩해서 내려준다.
function stripHtml(text: string): string {
  return text
    .replace(/<\/?b>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('query')?.trim()
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)

  if (!query) {
    return Response.json({ error: '검색어를 입력하세요.' }, { status: 400 })
  }

  if (!env.LOCAL_SEARCH_ID || !env.LOCAL_SEARCH_SECRET) {
    return Response.json(
      { error: '네이버 지역 검색 API 키가 설정되지 않았습니다. Cloudflare 대시보드에서 LOCAL_SEARCH_ID/LOCAL_SEARCH_SECRET을 설정해주세요.' },
      { status: 500 }
    )
  }

  const clientId = env.LOCAL_SEARCH_ID.trim()
  const clientSecret = env.LOCAL_SEARCH_SECRET.trim()
  const start = (page - 1) * PAGE_SIZE + 1

  const naverRes = await fetch(
    `https://naverapihub.apigw.ntruss.com/search/v1/local?query=${encodeURIComponent(query)}&display=${PAGE_SIZE}&start=${start}&sort=random`,
    {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
    }
  )

  // 업스트림 실패(401 등)를 그대로 돌려주면 프론트엔드가 "우리 서비스 로그인 세션 만료"로
  // 오인해 강제 로그아웃시키므로, 항상 502로 통일하고 실제 원인은 본문에만 담는다.
  if (!naverRes.ok) {
    const rawBody = await naverRes.text()
    return Response.json(
      { error: `네이버 지역 검색 API 호출에 실패했습니다. (HTTP ${naverRes.status}) ${rawBody.slice(0, 300)}` },
      { status: 502 }
    )
  }

  const data = await naverRes.json<NaverLocalSearchResponse>()

  return Response.json({
    items: data.items.map(item => ({
      title: stripHtml(item.title),
      category: item.category,
      address: item.address,
      roadAddress: item.roadAddress,
      mapx: item.mapx,
      mapy: item.mapy,
    })),
    total: data.total,
    page,
    totalPages: Math.max(1, Math.ceil(data.total / PAGE_SIZE)),
  })
}
