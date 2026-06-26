import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, Data } from '../../_types'

interface EquipmentItem {
  category: string
  name: string
  quantity: number
}

interface GenerateRequest {
  diagramKey: string
  buildingName?: string
  buildingAddress?: string
  floorArea?: number
  technicianGrade?: string
  selectedCategory?: string
  selectedEquipmentName?: string
  equipmentList?: EquipmentItem[]
}

const DIAGRAM_FILES: Record<string, string> = {
  '단독건물_계통도': '단독건물_계통도.md',
  '단독건물_구성도': '단독건물_구성도.md',
  '단지형건물_계통도': '단지형건물_계통도.md',
  '단지형건물_구성도': '단지형건물_구성도.md',
}

const CATEGORY_ORDER = ['통신설비', '방송설비', '정보설비', '기타설비']

function formatEquipmentList(items: EquipmentItem[]): string {
  if (!items || items.length === 0) return '(설비 정보 없음)'

  const grouped: Record<string, EquipmentItem[]> = {}
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  return CATEGORY_ORDER
    .filter(cat => grouped[cat])
    .map(cat => {
      const names = grouped[cat].map(i => i.quantity > 1 ? `${i.name} ${i.quantity}${i.name.includes('세대') ? '세대' : '식'}` : i.name)
      return `[${cat}] ${names.join(', ')}`
    })
    .join('\n')
}

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env }) => {
  const body = await request.json<GenerateRequest>()
  const { diagramKey, buildingName, buildingAddress, floorArea, technicianGrade,
          selectedCategory, selectedEquipmentName, equipmentList } = body

  const filename = DIAGRAM_FILES[diagramKey]
  if (!filename) {
    return Response.json({ error: '유효하지 않은 다이어그램 유형입니다.' }, { status: 400 })
  }

  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'OpenAI API 키가 설정되지 않았습니다. Cloudflare 대시보드에서 OPENAI_API_KEY를 설정해주세요.' },
      { status: 500 }
    )
  }

  const origin = new URL(request.url).origin
  const promptRes = await env.ASSETS.fetch(`${origin}/prompts/${filename}`)
  if (!promptRes.ok) {
    return Response.json(
      { error: `프롬프트 파일(${filename})을 찾을 수 없습니다. public/prompts/ 폴더에 파일을 추가해주세요.` },
      { status: 500 }
    )
  }

  let prompt = await promptRes.text()

  const CATEGORY_EN: Record<string, string> = {
    '통신설비': 'Telecommunications Equipment',
    '방송설비': 'Broadcasting Equipment',
    '정보설비': 'Information Systems Equipment',
    '기타설비': 'Other Facilities Equipment',
  }

  const generationScope = selectedEquipmentName
    ? `${selectedEquipmentName} (${selectedCategory})`
    : selectedCategory
      ? `${selectedCategory} 전체`
      : '전체 설비'

  const replacements: Record<string, string> = {
    '{{building_name}}': buildingName ?? '정보통신설비 관리 건물',
    '{{building_address}}': buildingAddress ?? '주소 미입력',
    '{{floor_area}}': floorArea ? floorArea.toLocaleString('ko-KR') : '미입력',
    '{{technician_grade}}': technicianGrade ?? '미정',
    '{{selected_category}}': selectedCategory ?? '전체 설비',
    '{{selected_category_en}}': selectedCategory ? (CATEGORY_EN[selectedCategory] ?? selectedCategory) : 'All Equipment',
    '{{selected_equipment}}': selectedEquipmentName ?? '전체',
    '{{generation_scope}}': generationScope,
    '{{equipment_list}}': formatEquipmentList(equipmentList ?? []),
    '{{equipment_count}}': String(equipmentList?.length ?? 0),
  }

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(key, value)
  }

  const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'high',
    }),
  })

  if (!openaiRes.ok) {
    const err = await openaiRes.json<{ error?: { message?: string } }>().catch(() => ({}))
    return Response.json(
      { error: err.error?.message ?? `OpenAI API 오류 (${openaiRes.status})` },
      { status: 500 }
    )
  }

  const result = await openaiRes.json<{ data: { b64_json?: string; url?: string }[] }>()
  const item = result.data?.[0]
  if (!item) {
    return Response.json({ error: '이미지를 받지 못했습니다.' }, { status: 500 })
  }

  if (item.url) {
    return Response.json({ url: item.url })
  }
  if (item.b64_json) {
    return Response.json({ b64: item.b64_json })
  }

  return Response.json({ error: '이미지 데이터를 받지 못했습니다.' }, { status: 500 })
}
