import { useState, useEffect } from 'react'
import { Sparkles, Download, Info, Loader2, ChevronRight } from 'lucide-react'
import { buildingsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { Building, EquipmentCategory } from '../types'

type BuildingCategory = '단독건물' | '단지형건물'
type DiagramType = '계통도' | '구성도'

const BUILDING_CATEGORY_LABELS: Record<BuildingCategory, string> = {
  단독건물: '단독 건물',
  단지형건물: '단지형 건물',
}

const ALL_CATEGORIES: EquipmentCategory[] = ['통신설비', '방송설비', '정보설비', '기타설비']

const CATEGORY_COLORS: Record<EquipmentCategory, { bg: string; text: string; border: string }> = {
  통신설비: { bg: '#e8f0fa', text: '#0066cc', border: '#0066cc' },
  방송설비: { bg: '#e8f5ee', text: '#00aa44', border: '#00aa44' },
  정보설비: { bg: '#fff4ec', text: '#ff6600', border: '#ff6600' },
  기타설비: { bg: '#f0eaf5', text: '#7700cc', border: '#7700cc' },
}

function getToken(): string {
  return localStorage.getItem('ict_token') ?? ''
}

export default function AIGenerate() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | ''>('')
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
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

  // 건물에 등록된 전체 설비 (checked 된 것만)
  const allEquipment = selectedBuilding
    ? selectedBuilding.equipment
        .filter(e => e.checked)
        .map(e => {
          const info = EQUIPMENT_LIST.find(eq => eq.id === e.equipmentId)
          return info ? { ...info, quantity: e.quantity } : null
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
    : []

  // 건물에 등록된 카테고리만 (순서 유지)
  const availableCategories = ALL_CATEGORIES.filter(cat =>
    allEquipment.some(e => e.category === cat)
  )

  // 선택한 카테고리 내 세부 설비
  const equipmentInCategory = selectedCategory
    ? allEquipment.filter(e => e.category === selectedCategory)
    : []

  // 생성에 사용할 설비 목록
  const selectedEquipmentInfo = equipmentInCategory.find(e => e.id === selectedEquipmentId)
  const equipmentListForGeneration = selectedEquipmentId
    ? equipmentInCategory
        .filter(e => e.id === selectedEquipmentId)
        .map(e => ({ category: e.category, name: e.name, quantity: e.quantity }))
    : equipmentInCategory.map(e => ({ category: e.category, name: e.name, quantity: e.quantity }))

  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id)
    setSelectedCategory('')
    setSelectedEquipmentId('')
    setResultUrl('')
    setError('')
  }

  const handleCategoryChange = (cat: EquipmentCategory) => {
    setSelectedCategory(cat)
    setSelectedEquipmentId('')
    setResultUrl('')
    setError('')
  }

  const canGenerate = !!selectedBuildingId && !!selectedCategory && !generating

  const handleGenerate = async () => {
    if (!canGenerate) return
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
          selectedCategory,
          selectedEquipmentName: selectedEquipmentInfo?.name,
          equipmentList: equipmentListForGeneration,
        }),
      })
      const data = await res.json() as { url?: string; b64?: string; error?: string }
      if (!res.ok || (!data.url && !data.b64)) {
        setError(data.error ?? '이미지 생성에 실패했습니다.')
      } else {
        setResultUrl(data.url ?? `data:image/png;base64,${data.b64}`)
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  // 생성 버튼 레이블
  const generateLabel = selectedEquipmentInfo
    ? `${selectedEquipmentInfo.name} ${diagramType} 생성`
    : selectedCategory
      ? `${selectedCategory} ${diagramType} 생성`
      : `${BUILDING_CATEGORY_LABELS[buildingCategory]} ${diagramType} 생성`

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-[11px] text-sm text-blue-700">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">AI 계통도 / 구성도 생성</p>
          <p>건물 유형, 도면 종류, 설비 카테고리를 선택하면 OpenAI gpt-image-2로 이미지를 자동 생성합니다.</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>이미지 생성</h2>
        </div>

        {/* 1. 건물 유형 */}
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
                {BUILDING_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 도면 종류 */}
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

        {/* 3. 건축물 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            건축물 선택 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBuildingId}
            onChange={e => handleBuildingChange(e.target.value)}
            className="input-field"
          >
            <option value="">건축물을 선택하세요</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* 4. 설비 카테고리 선택 */}
        {selectedBuilding && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설비 카테고리 선택 <span className="text-red-500">*</span>
            </label>
            {availableCategories.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 설비가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map(cat => {
                  const colors = CATEGORY_COLORS[cat]
                  const isSelected = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className="py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all border-2"
                      style={isSelected
                        ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }
                        : { backgroundColor: '#f5f5f7', color: '#6e6e73', borderColor: 'transparent' }
                      }
                    >
                      {cat}
                      {isSelected && (
                        <span className="ml-1 text-xs opacity-70">
                          ({equipmentInCategory.length}종)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. 세부 항목 선택 (선택사항) */}
        {selectedCategory && equipmentInCategory.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              세부 항목 선택{' '}
              <span className="font-normal text-gray-400">(선택 안 하면 카테고리 전체 생성)</span>
            </label>
            <div className="space-y-1.5">
              {/* 전체 선택 옵션 */}
              <button
                type="button"
                onClick={() => setSelectedEquipmentId('')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border-2 transition-all ${
                  !selectedEquipmentId
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-medium'
                    : 'border-transparent bg-[#f5f5f7] text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>전체 ({equipmentInCategory.length}종)</span>
                {!selectedEquipmentId && <ChevronRight size={14} className="text-gray-400" />}
              </button>
              {equipmentInCategory.map(eq => {
                const colors = CATEGORY_COLORS[selectedCategory as EquipmentCategory]
                const isSelected = selectedEquipmentId === eq.id
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setSelectedEquipmentId(isSelected ? '' : eq.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border-2 transition-all"
                    style={isSelected
                      ? { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }
                      : { backgroundColor: '#f5f5f7', borderColor: 'transparent', color: '#3a3a3a' }
                    }
                  >
                    <span>{eq.name}{eq.quantity > 1 ? ` × ${eq.quantity}` : ''}</span>
                    {isSelected && <ChevronRight size={14} style={{ color: colors.text }} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 선택 요약 */}
        {selectedCategory && (
          <div className="px-4 py-3 bg-[#f5f5f7] rounded-[11px] text-sm space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap text-gray-500">
              <span style={{ color: '#1d1d1f', fontWeight: 600 }}>{BUILDING_CATEGORY_LABELS[buildingCategory]}</span>
              <ChevronRight size={12} />
              <span style={{ color: '#1d1d1f', fontWeight: 600 }}>{diagramType}</span>
              <ChevronRight size={12} />
              <span style={{ color: '#1d1d1f', fontWeight: 600 }}>{selectedBuilding?.name}</span>
              <ChevronRight size={12} />
              <span style={{ color: CATEGORY_COLORS[selectedCategory as EquipmentCategory].text, fontWeight: 600 }}>
                {selectedCategory}
              </span>
              {selectedEquipmentInfo && (
                <>
                  <ChevronRight size={12} />
                  <span style={{ color: '#1d1d1f', fontWeight: 600 }}>{selectedEquipmentInfo.name}</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {selectedEquipmentInfo
                ? `"${selectedEquipmentInfo.name}" 단일 항목으로 생성합니다.`
                : `"${selectedCategory}" 전체 ${equipmentInCategory.length}종으로 생성합니다.`}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-[11px] px-4 py-2.5">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              생성 중 (최대 30초 소요)...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {generateLabel}
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
              download={`${generateLabel}_${Date.now()}.png`}
              {...(!resultUrl.startsWith('data:') && { target: '_blank', rel: 'noopener noreferrer' })}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <Download size={14} />
              다운로드
            </a>
          </div>
          <img
            src={resultUrl}
            alt={`${generateLabel} 생성 결과`}
            className="w-full rounded-xl border border-gray-200"
          />
          <p className="text-xs text-center" style={{ color: '#6e6e73' }}>
            OpenAI gpt-image-2 생성 이미지
          </p>
        </div>
      )}
    </div>
  )
}
