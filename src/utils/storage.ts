// localStorage 기반 코드는 D1 API(api.ts)로 마이그레이션됨
// generateId는 클라이언트 사이드 ID 생성에만 사용 (점검 항목, 위치, 사진 등 JSON 내부 객체)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
