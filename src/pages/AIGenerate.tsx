import { useState, useEffect } from 'react'
import { Sparkles, Download, Info, Loader2 } from 'lucide-react'
import { buildingsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { Building } from '../types'

type BuildingCategory = '단독건물' | '단지형건물'
type DiagramType = '계통도' | '구성도'

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  단독건물: '단독 건물',
  단지형건물: '단지형 건물',
}

function getToken(): string {
  return localStorage.getItem('ict_token') ?? ''
}

function formatEquipmentForRequest(building: Building) {
  return building.equipment
    .filter(e => e.checked)
    .map(e => {
      const info = EQUIPMENT_LIST.find(eq => eq.id === e.equipmentId)
      return info ? { category: info.category, name: info.name, quantity: e.quantity } : null
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
}

export default function AIGenerate() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [buildingCategory, setBuildingCategory] = useState<BuildingCategory>('단독건물')
  const [diagramType, setDiagramType] = useState<DiagramType>('계통도')
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(() => {})
  }, [])

  const diagramKey = `${buildingCategory}_${diagramType}`
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setResultUrl('')

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          diagramKey,
          buildingName: selectedBuilding?.name,
          buildingAddress: selectedBuilding?.address,
          floorArea: selectedBuilding?.floorArea,
          technicianGrade: selectedBuilding?.technicianGrade,
          equipmentList: selectedBuilding ? formatEquipmentForRequest(selectedBuilding) : [],
        }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? '이미지 생성에 실패했습니다.')
      } else {
        setResultUrl(data.url)
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const equipmentPreview = selectedBuilding ? formatEquipmentForRequest(selectedBuilding) : []

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-[11px] text-sm text-blue-700">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">AI 계통도 / 구성도 생성</p>
          <p>건물 유형과 도면 종류를 선택하면 OpenAI DALL-E 3로 이미지를 자동 생성합니다.</p>
          <p className="mt-1 text-blue-600">건축물을 선택하면 설비 데이터가 프롬프트에 반영됩니다.</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>이미지 생성</h2>
        </div>

        {/* 건물 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">건물 유형</label>
          <div className="flex gap-3">
            {(['단독건물', '단지형건물'] as BuildingCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setBuildingCategory(cat)}
                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  buildingCategory === cat ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={buildingCategory === cat ? { backgroundColor: '#0066cc' } : {}}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 도면 종류 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">도면 종류</label>
          <div className="flex gap-3">
            {(['계통도', '구성도'] as DiagramType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setDiagramType(type)}
                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  diagramType === type ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={diagramType === type ? { backgroundColor: '#0066cc' } : {}}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 건축물 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">건축물 선택</label>
          <select
            value={selectedBuildingId}
            onChange={e => setSelectedBuildingId(e.target.value)}
            className="input-field"
          >
            <option value="">선택 안 함 (기본 템플릿 사용)</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* 선택된 건물 데이터 미리보기 */}
        {selectedBuilding && (
          <div className="bg-[#f5f5f7] rounded-[11px] px-4 py-3 text-sm space-y-1.5">
            <p className="font-medium" style={{ color: '#1d1d1f' }}>{selectedBuilding.name}</p>
            <p style={{ color: '#6e6e73' }}>{selectedBuilding.address}</p>
            <p style={{ color: '#6e6e73' }}>
              연면적 {selectedBuilding.floorArea.toLocaleString()}㎡ · {selectedBuilding.technicianGrade}
            </p>
            {equipmentPreview.length > 0 && (
              <p style={{ color: '#6e6e73' }}>
                대상설비 {equipmentPreview.length}종:{' '}
                <span style={{ color: '#1d1d1f' }}>
                  {equipmentPreview.slice(0, 3).map(e => e.name).join(', ')}
                  {equipmentPreview.length > 3 && ` 외 ${equipmentPreview.length - 3}종`}
                </span>
              </p>
            )}
          </div>
        )}

        {/* 현재 선택 요약 */}
        <div className="px-4 py-2.5 bg-[#f5f5f7] rounded-[11px] text-sm" style={{ color: '#6e6e73' }}>
          생성 유형:{' '}
          <span className="font-semibold" style={{ color: '#1d1d1f' }}>
            {CATEGORY_LABELS[buildingCategory]} {diagramType}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-[11px] px-4 py-2.5">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              생성 중 (최대 30초 소요)...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {CATEGORY_LABELS[buildingCategory]} {diagramType} 생성
            </>
          )}
        </button>
      </div>

      {/* 결과 이미지 */}
      {resultUrl && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>생성 결과</h2>
            <a
              href={resultUrl}
              download={`${diagramKey}_${Date.now()}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Download size={14} />
              다운로드
            </a>
          </div>
          <img
            src={resultUrl}
            alt={`${CATEGORY_LABELS[buildingCategory]} ${diagramType} 생성 결과`}
            className="w-full rounded-xl border border-gray-200"
          />
          <p className="text-xs text-center" style={{ color: '#6e6e73' }}>
            DALL-E 3 생성 이미지 · 링크는 1시간 후 만료됩니다
          </p>
        </div>
      )}
    </div>
  )
}
