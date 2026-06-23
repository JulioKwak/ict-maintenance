import { useState, useMemo, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Camera, CheckCircle, XCircle, AlertTriangle, Save } from 'lucide-react'
import {
  getBuildings,
  getInspections,
  addInspection,
  updateInspection,
  updateBuilding,
  getBuildingById,
  generateId,
} from '../utils/storage'
import { EQUIPMENT_LIST } from '../data/equipment'
import { INSPECTION_ITEMS } from '../data/inspectionItems'
import { useAuth } from '../context/AuthContext'
import type { InspectionForm, InspectionType, InspectionItem, InspectionLocation, InspectionResult, InspectionPhoto } from '../types'
import { format } from 'date-fns'

const isMobile = window.innerWidth < 768

export default function Inspection() {
  const { user } = useAuth()
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedInspectionId, setSelectedInspectionId] = useState('')
  const [inspectionType, setInspectionType] = useState<InspectionType>('기능점검')
  const [inspectionDate, setInspectionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [activeEquipmentId, setActiveEquipmentId] = useState<string | null>(null)
  const [form, setForm] = useState<InspectionForm | null>(null)

  const buildings = useMemo(() => getBuildings(), [])
  const inspections = useMemo(() => getInspections(), [])

  const selectedBuilding = useMemo(
    () => buildings.find(b => b.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  )

  // 해당 건축물의 기존 점검표 목록
  const buildingInspections = useMemo(
    () => inspections.filter(i => i.buildingId === selectedBuildingId),
    [inspections, selectedBuildingId]
  )

  const handleStart = () => {
    if (!selectedBuildingId) return

    if (selectedInspectionId) {
      // 기존 점검표 불러오기
      const existing = inspections.find(i => i.id === selectedInspectionId)
      if (existing) {
        setForm(existing)
        if (existing.items.length > 0) setActiveEquipmentId(existing.items[0].equipmentId)
        setStep('form')
        return
      }
    }

    // 새 점검표 생성
    const building = buildings.find(b => b.id === selectedBuildingId)
    if (!building) return

    const checkedEquipment = building.equipment.filter(e => e.checked)
    const items: InspectionItem[] = checkedEquipment.flatMap(be => {
      const template = INSPECTION_ITEMS[be.equipmentId]
      if (!template) return []
      const templateItems = inspectionType === '기능점검' ? template.functional : template.performance
      return templateItems.map(t => ({
        id: generateId(),
        equipmentId: be.equipmentId,
        subCategory: t.subCategory,
        range: t.range,
        content: t.content,
        locations: [{
          id: generateId(),
          location: '',
          result: '' as InspectionResult,
          deficiency: '',
          opinion: '',
          photos: [],
        }],
      }))
    })

    const newForm: InspectionForm = {
      id: generateId(),
      buildingId: selectedBuildingId,
      inspectionType,
      inspectionDate,
      items,
      status: '작성중',
      reviewNote: '',
      createdBy: user?.id ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setForm(newForm)
    if (items.length > 0) setActiveEquipmentId(items[0].equipmentId)
    setStep('form')
  }

  const saveItem = useCallback(() => {
    if (!form) return
    const updated: InspectionForm = { ...form, status: '작성중', updatedAt: new Date().toISOString() }
    if (inspections.find(i => i.id === form.id)) {
      updateInspection(updated)
    } else {
      addInspection(updated)
    }
    // 건축물 상태 갱신
    const building = getBuildingById(form.buildingId)
    if (building && building.status === '등록') {
      updateBuilding({ ...building, status: '작성중', updatedAt: new Date().toISOString() })
    }
    setForm(updated)
    alert('저장되었습니다.')
  }, [form, inspections])

  const completeInspection = useCallback(() => {
    if (!form) return
    if (!window.confirm('점검을 완료 처리하시겠습니까?')) return
    const updated: InspectionForm = { ...form, status: '작성완료', updatedAt: new Date().toISOString() }
    if (inspections.find(i => i.id === form.id)) {
      updateInspection(updated)
    } else {
      addInspection(updated)
    }
    const building = getBuildingById(form.buildingId)
    if (building) {
      updateBuilding({ ...building, status: '작성완료', updatedAt: new Date().toISOString() })
    }
    setForm(updated)
    alert('점검이 완료 처리되었습니다.')
    setStep('select')
  }, [form, inspections])

  const updateItemLocation = useCallback((
    itemId: string,
    locId: string,
    field: keyof InspectionLocation,
    value: string | InspectionPhoto[]
  ) => {
    setForm(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id !== itemId ? item : {
            ...item,
            locations: item.locations.map(loc =>
              loc.id !== locId ? loc : { ...loc, [field]: value }
            ),
          }
        ),
      }
    })
  }, [])

  const addLocation = useCallback((itemId: string) => {
    setForm(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id !== itemId ? item : {
            ...item,
            locations: [...item.locations, {
              id: generateId(),
              location: '',
              result: '' as InspectionResult,
              deficiency: '',
              opinion: '',
              photos: [],
            }],
          }
        ),
      }
    })
  }, [])

  const removeLocation = useCallback((itemId: string, locId: string) => {
    setForm(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id !== itemId ? item : {
            ...item,
            locations: item.locations.filter(loc => loc.id !== locId),
          }
        ),
      }
    })
  }, [])

  // 설비별 점검 완료 여부
  const equipmentCompletionMap = useMemo(() => {
    if (!form) return {}
    const map: Record<string, boolean> = {}
    const grouped: Record<string, InspectionItem[]> = {}
    for (const item of form.items) {
      if (!grouped[item.equipmentId]) grouped[item.equipmentId] = []
      grouped[item.equipmentId].push(item)
    }
    for (const [eqId, items] of Object.entries(grouped)) {
      const allDone = items.every(item =>
        item.locations.every(loc => loc.result !== '')
      )
      map[eqId] = allDone
    }
    return map
  }, [form])

  if (step === 'select') {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b">점검표 작성</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">건축물 선택 *</label>
              <select
                value={selectedBuildingId}
                onChange={e => { setSelectedBuildingId(e.target.value); setSelectedInspectionId('') }}
                className="input-field"
              >
                <option value="">건축물을 선택하세요</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {selectedBuilding && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                  <p><span className="text-gray-500">주소:</span> <span className="text-gray-800">{selectedBuilding.address}</span></p>
                  <p><span className="text-gray-500">연면적:</span> <span className="text-gray-800">{selectedBuilding.floorArea.toLocaleString()}㎡</span></p>
                  <p><span className="text-gray-500">등록 설비:</span> <span className="text-gray-800">{selectedBuilding.equipment.filter(e => e.checked).length}종</span></p>
                </div>

                {buildingInspections.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기존 점검표 불러오기 (선택)</label>
                    <select
                      value={selectedInspectionId}
                      onChange={e => setSelectedInspectionId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">새 점검표 작성</option>
                      {buildingInspections.map(i => (
                        <option key={i.id} value={i.id}>
                          [{i.inspectionType}] {i.inspectionDate} ({i.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!selectedInspectionId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">점검 유형 *</label>
                      <div className="flex gap-3">
                        {(['기능점검', '성능점검'] as InspectionType[]).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setInspectionType(type)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              inspectionType === type
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">점검 일자 *</label>
                      <input
                        type="date"
                        value={inspectionDate}
                        onChange={e => setInspectionDate(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleStart}
                  className="btn-primary w-full"
                >
                  {selectedInspectionId ? '점검표 불러오기' : '점검표 작성 시작'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!form || !selectedBuilding) return null

  // 설비별 그룹
  const equipmentGroups: Record<string, InspectionItem[]> = {}
  for (const item of form.items) {
    if (!equipmentGroups[item.equipmentId]) equipmentGroups[item.equipmentId] = []
    equipmentGroups[item.equipmentId].push(item)
  }

  const uniqueEquipmentIds = [...new Set(form.items.map(i => i.equipmentId))]

  return (
    <div className={`${isMobile ? '' : 'flex gap-6'}`}>
      {/* 설비 카드 목록 (사이드바 or 상단) */}
      <div className={`${isMobile ? 'mb-4 overflow-x-auto' : 'w-60 shrink-0'}`}>
        <div className={`${isMobile ? 'flex gap-2 pb-2' : 'space-y-2'}`}>
          {uniqueEquipmentIds.map(eqId => {
            const eq = EQUIPMENT_LIST.find(e => e.id === eqId)
            const done = equipmentCompletionMap[eqId]
            const active = activeEquipmentId === eqId
            return (
              <button
                key={eqId}
                onClick={() => setActiveEquipmentId(eqId)}
                className={`${
                  isMobile ? 'shrink-0 px-3 py-2 text-xs' : 'w-full px-3 py-3 text-left text-sm'
                } rounded-lg border transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : done
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {done
                  ? <CheckCircle size={14} className={active ? 'text-white' : 'text-green-600'} />
                  : <AlertTriangle size={14} className={active ? 'text-white' : 'text-yellow-500'} />
                }
                <span className="leading-tight">{eq?.name ?? eqId}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 점검표 본문 */}
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-gray-800">{selectedBuilding.name}</h2>
            <p className="text-sm text-gray-500">
              [{form.inspectionType}] {form.inspectionDate}
              {form.status !== '작성중' && (
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  form.status === '검수완료' ? 'bg-green-100 text-green-700' :
                  form.status === '점검표보완' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{form.status}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={saveItem} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Save size={14} />항목 저장
            </button>
            {form.status === '작성중' && (
              <button onClick={completeInspection} className="btn-primary flex items-center gap-1.5 text-sm">
                <CheckCircle size={14} />점검 완료
              </button>
            )}
            <button onClick={() => setStep('select')} className="btn-secondary text-sm">목록으로</button>
          </div>
        </div>

        {activeEquipmentId && equipmentGroups[activeEquipmentId] && (
          <EquipmentInspectionPanel
            equipmentId={activeEquipmentId}
            items={equipmentGroups[activeEquipmentId]}
            building={selectedBuilding}
            form={form}
            onUpdateLocation={updateItemLocation}
            onAddLocation={addLocation}
            onRemoveLocation={removeLocation}
            readonly={form.status === '검수완료'}
          />
        )}
      </div>
    </div>
  )
}

function EquipmentInspectionPanel({
  equipmentId,
  items,
  building,
  form,
  onUpdateLocation,
  onAddLocation,
  onRemoveLocation,
  readonly,
}: {
  equipmentId: string
  items: InspectionItem[]
  building: ReturnType<typeof getBuildings>[0]
  form: InspectionForm
  onUpdateLocation: (itemId: string, locId: string, field: keyof InspectionLocation, value: string | InspectionPhoto[]) => void
  onAddLocation: (itemId: string) => void
  onRemoveLocation: (itemId: string, locId: string) => void
  readonly: boolean
}) {
  const eq = EQUIPMENT_LIST.find(e => e.id === equipmentId)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.id, true]))
  )

  const toggleItem = (id: string) => setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2 py-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{eq?.category}</span>
        <span className="font-semibold text-gray-800">{eq?.name}</span>
      </div>

      {items.map(item => (
        <div key={item.id} className="card p-0 overflow-hidden">
          {/* 항목 헤더 */}
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            onClick={() => toggleItem(item.id)}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded ${
                item.subCategory === '외관' ? 'bg-gray-100 text-gray-700' :
                item.subCategory === '기능' ? 'bg-blue-50 text-blue-700' :
                item.subCategory === '안전' ? 'bg-red-50 text-red-700' :
                'bg-gray-50 text-gray-500'
              }`}>{item.subCategory}</span>
              {item.range !== '-' && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">{item.range}</span>
              )}
              <span className="text-sm text-gray-800">{item.content}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.locations.every(l => l.result !== '') ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-yellow-400" />
              )}
              {expandedItems[item.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>

          {/* 점검 위치 목록 */}
          {expandedItems[item.id] && (
            <div className="border-t border-gray-100">
              {item.locations.map((loc, locIdx) => (
                <LocationRow
                  key={loc.id}
                  loc={loc}
                  locIdx={locIdx}
                  item={item}
                  building={building}
                  form={form}
                  onUpdate={onUpdateLocation}
                  onRemove={onRemoveLocation}
                  canRemove={item.locations.length > 1}
                  readonly={readonly}
                />
              ))}
              {!readonly && (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => onAddLocation(item.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} />점검 위치 추가
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function LocationRow({
  loc,
  locIdx,
  item,
  building,
  form,
  onUpdate,
  onRemove,
  canRemove,
  readonly,
}: {
  loc: InspectionLocation
  locIdx: number
  item: InspectionItem
  building: ReturnType<typeof getBuildings>[0]
  form: InspectionForm
  onUpdate: (itemId: string, locId: string, field: keyof InspectionLocation, value: string | InspectionPhoto[]) => void
  onRemove: (itemId: string, locId: string) => void
  canRemove: boolean
  readonly: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const eq = EQUIPMENT_LIST.find(e => e.id === item.equipmentId)

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const canvas = document.createElement('canvas')
        const img = new Image()
        img.onload = () => {
          const W = img.width
          const H = img.height
          canvas.width = W
          canvas.height = H
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)

          // 보드판 오버레이
          const boardH = Math.round(H * 0.22)
          ctx.fillStyle = 'rgba(0,0,0,0.72)'
          ctx.fillRect(0, H - boardH, W, boardH)

          const lines = [
            `건축물명: ${building.name}`,
            `주소: ${building.address}`,
            `설비분류: ${eq?.category ?? ''}`,
            `설비명: ${eq?.name ?? ''}`,
            `점검세부위치: ${loc.location || ''}`,
            `점검일자: ${form.inspectionDate}`,
            `점검결과: ${loc.result || '-'}`,
          ]
          const lineH = boardH / (lines.length + 0.5)
          ctx.fillStyle = '#ffffff'
          ctx.font = `${Math.round(lineH * 0.7)}px sans-serif`
          lines.forEach((line, i) => {
            ctx.fillText(line, 12, H - boardH + lineH * (i + 0.9))
          })

          const newPhoto: InspectionPhoto = { id: generateId(), dataUrl: canvas.toDataURL('image/jpeg', 0.85), caption: '' }
          onUpdate(item.id, loc.id, 'photos', [...loc.photos, newPhoto])
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="p-4 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">점검위치 #{locIdx + 1}</span>
        {canRemove && !readonly && (
          <button
            onClick={() => onRemove(item.id, loc.id)}
            className="text-red-400 hover:text-red-600 p-1"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">점검 위치</label>
          <input
            type="text"
            value={loc.location}
            onChange={e => onUpdate(item.id, loc.id, 'location', e.target.value)}
            className="input-field text-sm"
            placeholder="예: 3층 통신실 통신랙 #2"
            disabled={readonly}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">점검 결과</label>
          <div className="flex gap-2">
            {(['양호', '미흡'] as const).map(r => (
              <button
                key={r}
                type="button"
                disabled={readonly}
                onClick={() => onUpdate(item.id, loc.id, 'result', r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  loc.result === r
                    ? r === '양호'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {r === '양호' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {loc.result === '미흡' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">미흡 사항</label>
            <textarea
              value={loc.deficiency}
              onChange={e => onUpdate(item.id, loc.id, 'deficiency', e.target.value)}
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="미흡 사항을 입력하세요"
              disabled={readonly}
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">점검 의견</label>
          <textarea
            value={loc.opinion}
            onChange={e => onUpdate(item.id, loc.id, 'opinion', e.target.value)}
            className="input-field text-sm resize-none"
            rows={2}
            placeholder="점검 의견을 입력하세요"
            disabled={readonly}
          />
        </div>

        {/* 사진 등록 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">사진 등록</label>
          <div className="flex flex-wrap gap-2">
            {loc.photos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.dataUrl}
                  alt="점검사진"
                  className="w-20 h-20 object-cover rounded border border-gray-200"
                />
                {!readonly && (
                  <button
                    onClick={() => onUpdate(item.id, loc.id, 'photos', loc.photos.filter(p => p.id !== photo.id))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!readonly && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Camera size={20} />
                <span className="text-xs mt-1">사진 추가</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handlePhotoUpload(e.target.files)}
          />
        </div>
      </div>
    </div>
  )
}
