import type { EquipmentReview, InspectionFormStatus, InspectionType } from '../types'

// 설비별 검수 결과로부터 점검표 상태를 계산한다.
// 보완 1건이라도 있으면 점검표보완이 최우선, 아니면 검수완료 1건이라도 있으면 검수중, 아니면 작성완료.
export function deriveReviewStatus(
  equipmentIds: string[],
  equipmentReviews: Record<string, EquipmentReview>
): '작성완료' | '점검표보완' | '검수중' {
  const verdicts = equipmentIds.map(id => equipmentReviews[id]?.result ?? '')
  if (verdicts.some(v => v === '보완')) return '점검표보완'
  if (verdicts.some(v => v === '검수완료')) return '검수중'
  return '작성완료'
}

export const INSPECTION_STATUS_STYLE: Record<InspectionFormStatus, string> = {
  작성중: 'bg-yellow-100 text-yellow-700',
  작성완료: 'bg-blue-100 text-blue-700',
  점검표보완: 'bg-orange-100 text-orange-700',
  검수중: 'bg-purple-100 text-purple-700',
  검수완료: 'bg-green-100 text-green-700',
}

export const INSPECTION_TYPE_STYLE: Record<InspectionType, string> = {
  '기능점검(상반기)': 'bg-blue-50 text-blue-700',
  '기능점검(하반기)': 'bg-teal-50 text-teal-700',
  '성능점검': 'bg-purple-50 text-purple-700',
}
