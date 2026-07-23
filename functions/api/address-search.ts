import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../_types'

interface NaverGeocodeResponse {
  status: string
  addresses: {
    roadAddress: string
    jibunAddress: string
  }[]
}

interface NaverLocalSearchResponse {
  items: {
    title: string
    category: string
    address: string
    roadAddress: string
  }[]
}

interface Candidate {
  title: string
  category: string
  address: string
  roadAddress: string
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

// Geocoding: 완전한 주소~부분 도로명까지 처리, "OO로13나길 3, 5, 7..."처럼 같은 도로 위 여러 번지를 후보로 돌려준다.
async function fetchGeocode(query: string, clientId: string, clientSecret: string): Promise<Candidate[]> {
  try {
    const res = await fetch(
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}&count=100`,
      {
        headers: {
          'x-ncp-apigw-api-key-id': clientId,
          'x-ncp-apigw-api-key': clientSecret,
          'Accept': 'application/json',
        },
      }
    )
    if (!res.ok) return []
    const data = await res.json<NaverGeocodeResponse>()
    if (data.status !== 'OK') return []
    return data.addresses.map(a => ({
      title: '',
      category: '',
      address: a.jibunAddress,
      roadAddress: a.roadAddress,
    }))
  } catch {
    return []
  }
}

// 지역 검색: 건물명·상호명으로 등록된 업체/기관을 찾는다. display 최댓값이 5라 한 번에 최대 5건만 온다.
async function fetchLocalSearch(query: string, clientId: string, clientSecret: string): Promise<Candidate[]> {
  try {
    const res = await fetch(
      `https://naverapihub.apigw.ntruss.com/search/v1/local?query=${encodeURIComponent(query)}&display=5&start=1&sort=random`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret,
        },
      }
    )
    if (!res.ok) return []
    const data = await res.json<NaverLocalSearchResponse>()
    return data.items.map(item => ({
      title: stripHtml(item.title),
      category: item.category,
      address: item.address,
      roadAddress: item.roadAddress,
    }))
  } catch {
    return []
  }
}

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('query')?.trim()
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)

  if (!query) {
    return Response.json({ error: '검색어를 입력하세요.' }, { status: 400 })
  }

  if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET || !env.LOCAL_SEARCH_ID || !env.LOCAL_SEARCH_SECRET) {
    return Response.json(
      { error: '네이버 지도 API 키가 설정되지 않았습니다. Cloudflare 대시보드에서 NAVER_CLIENT_ID/NAVER_CLIENT_SECRET, LOCAL_SEARCH_ID/LOCAL_SEARCH_SECRET을 설정해주세요.' },
      { status: 500 }
    )
  }

  const [geocodeResults, localResults] = await Promise.all([
    fetchGeocode(query, env.NAVER_CLIENT_ID.trim(), env.NAVER_CLIENT_SECRET.trim()),
    fetchLocalSearch(query, env.LOCAL_SEARCH_ID.trim(), env.LOCAL_SEARCH_SECRET.trim()),
  ])

  // 주소(지오코딩) 결과를 기본 순서로 두고, 지역검색에 같은 주소의 업체/기관명이 있으면 그 이름으로 덮어써서
  // 후보 목록에 건물명이 함께 보이게 한다. Map은 키 재설정 시 삽입 순서(=지오코딩 우선순위)를 유지한다.
  const byKey = new Map<string, Candidate>()
  for (const item of geocodeResults) {
    const key = item.roadAddress || item.address
    if (key) byKey.set(key, item)
  }
  for (const item of localResults) {
    const key = item.roadAddress || item.address
    if (key) byKey.set(key, item)
  }
  const merged = Array.from(byKey.values())

  const start = (page - 1) * PAGE_SIZE
  const items = merged.slice(start, start + PAGE_SIZE)

  return Response.json({
    items,
    total: merged.length,
    page,
    totalPages: Math.max(1, Math.ceil(merged.length / PAGE_SIZE)),
  })
}
