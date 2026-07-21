import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, Circle, ChevronRight, MessageSquare, ArrowLeft, RotateCcw, X } from 'lucide-react'
import { inspectionsApi, buildingsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import { useAuth } from '../context/AuthContext'
import { deriveReviewStatus, INSPECTION_STATUS_STYLE } from '../utils/inspectionStatus'
import type { InspectionForm, InspectionItem, EquipmentReview, Building } from '../types'

export default function InspectionReview() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paramBuildingId = searchParams.get('buildingId') ?? ''
  const paramInspectionId = searchParams.get('inspectionId') ?? ''

  const [inspections, setInspections] = useState<InspectionForm[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(paramInspectionId || null)
  const [activeEquipmentId, setActiveEquipmentId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const didAutoSelect = useRef(false)
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      inspectionsApi.getAll(),
      buildingsApi.getAll(),
    ]).then(([insp, blds]) => {
      setInspections(insp)
      setBuildings(blds)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (didAutoSelect.current) return
    if (!paramInspectionId || inspections.length === 0) return
    const found = inspections.find(i => i.id === paramInspectionId)
    if (found) {
      didAutoSelect.current = true
      setSelectedId(found.id)
      setReviewNote(found.reviewNote)
      const ids = [...new Set(found.items.map(i => i.equipmentId))]
      setActiveEquipmentId(ids[0] ?? null)
    }
  }, [inspections, paramInspectionId])

  const reviewTargets = useMemo(() => {
    const base = inspections.filter(
      i => i.status === '작성완료' || i.status === '점검표보완' || i.status === '검수중' || i.status === '검수완료'
    )
    return paramBuildingId ? base.filter(i => i.buildingId === paramBuildingId) : base
  }, [inspections, paramBuildingId])

  const selectedInspection = useMemo(
    () => inspections.find(i => i.id === selectedId) ?? null,
    [inspections, selectedId]
  )

  const selectedBuilding = useMemo(
    () => buildings.find(b => b.id === selectedInspection?.buildingId),
    [buildings, selectedInspection]
  )

  const contextBuilding = useMemo(
    () => paramBuildingId ? buildings.find(b => b.id === paramBuildingId) : null,
    [buildings, paramBuildingId]
  )

  const equipmentGroups = useMemo(() => {
    const groups: Record<string, InspectionItem[]> = {}
    if (!selectedInspection) return groups
    for (const item of selectedInspection.items) {
      if (!groups[item.equipmentId]) groups[item.equipmentId] = []
      groups[item.equipmentId].push(item)
    }
    return groups
  }, [selectedInspection])

  const uniqueEquipmentIds = useMemo(() => Object.keys(equipmentGroups), [equipmentGroups])

  // 등록된 설비가 전부 "검수완료"로 처리됐을 때만 최종 검수완료 가능
  const allEquipmentApproved = useMemo(
    () => uniqueEquipmentIds.length > 0 && uniqueEquipmentIds.every(
      id => selectedInspection?.equipmentReviews[id]?.result === '검수완료'
    ),
    [uniqueEquipmentIds, selectedInspection]
  )

  const handleSelect = (insp: InspectionForm) => {
    setSelectedId(insp.id)
    setReviewNote(insp.reviewNote)
    const ids = [...new Set(insp.items.map(i => i.equipmentId))]
    setActiveEquipmentId(ids[0] ?? null)
  }

  const handleEquipmentReview = async (eqId: string, result: '보완' | '검수완료', note: string) => {
    if (!selectedInspection) return
    if (result === '보완' && !note.trim()) { alert('보완 사유를 입력해주세요.'); return }
    setSaving(true)
    try {
      const updatedReviews = { ...selectedInspection.equipmentReviews, [eqId]: { result, note } }
      const newStatus = deriveReviewStatus(uniqueEquipmentIds, updatedReviews)
      const updated = await inspectionsApi.update(selectedInspection.id, { equipmentReviews: updatedReviews, status: newStatus })
      setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))
      if (selectedBuilding) {
        await buildingsApi.update(selectedBuilding.id, { status: newStatus })
        setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, status: newStatus } : b))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalApprove = async () => {
    if (!selectedInspection) return
    if (!window.confirm('최종 검수 완료 처리하시겠습니까?')) return
    setSaving(true)
    try {
      const updated = await inspectionsApi.update(selectedInspection.id, { status: '검수완료', reviewNote })
      setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))
      if (selectedBuilding) {
        await buildingsApi.update(selectedBuilding.id, { status: '검수완료' })
        setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, status: '검수완료' } : b))
      }
      alert('최종 검수 완료 처리되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReopenForReview = async () => {
    if (!selectedInspection) return
    if (!window.confirm('최종 검수완료를 취소하고 재검수 상태로 되돌리시겠습니까?')) return
    setSaving(true)
    try {
      const newStatus = deriveReviewStatus(uniqueEquipmentIds, selectedInspection.equipmentReviews)
      const updated = await inspectionsApi.update(selectedInspection.id, { status: newStatus })
      setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))
      if (selectedBuilding) {
        await buildingsApi.update(selectedBuilding.id, { status: newStatus })
        setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, status: newStatus } : b))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedInspection) return
    setSaving(true)
    try {
      const updated = await inspectionsApi.update(selectedInspection.id, { reviewNote })
      setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))
      alert('저장되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 건축물 컨텍스트 헤더 (buildingId 파라미터 있을 때) */}
      {contextBuilding && (
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: '#0066cc' }}
          >
            <ArrowLeft size={15} />
            건축물 관리
          </button>
          <span style={{ color: '#e0e0e0' }}>·</span>
          <span className="font-semibold truncate" style={{ color: '#1d1d1f', fontSize: '14px' }}>
            {contextBuilding.name}
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[calc(100vh-8rem)]">
        {/* 목록 */}
        <div className="w-full md:w-80 shrink-0 md:overflow-y-auto space-y-2">
          <h2 className="font-semibold mb-3" style={{ color: '#1d1d1f', fontSize: '14px' }}>
            {contextBuilding ? `${contextBuilding.name} 점검표` : '점검완료 목록'}
          </h2>
          {reviewTargets.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#7a7a7a' }}>
              {contextBuilding ? '검수할 점검표가 없습니다.' : '검수 대기 중인 점검표가 없습니다.'}
            </p>
          ) : (
            reviewTargets.map(insp => {
              const building = buildings.find(b => b.id === insp.buildingId)
              const active = selectedId === insp.id
              return (
                <button
                  key={insp.id}
                  onClick={() => handleSelect(insp)}
                  className="w-full text-left p-3 transition-all"
                  style={{
                    borderRadius: '12px',
                    border: `1px solid ${active ? '#0066cc' : '#e0e0e0'}`,
                    backgroundColor: active ? 'rgba(0,102,204,0.05)' : '#ffffff',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {!paramBuildingId && (
                        <p className="text-sm font-medium truncate" style={{ color: '#1d1d1f' }}>
                          {building?.name ?? '-'}
                        </p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: '#7a7a7a' }}>
                        [{insp.inspectionType}] {insp.inspectionDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${INSPECTION_STATUS_STYLE[insp.status]}`}>
                        {insp.status}
                      </span>
                      <ChevronRight size={14} style={{ color: '#e0e0e0' }} />
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* 상세 */}
        <div className="flex-1 overflow-y-auto">
          {!selectedInspection ? (
            <div className="flex items-center justify-center h-full" style={{ color: '#7a7a7a' }}>
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p style={{ fontSize: '14px' }}>점검표를 선택하면 내용을 확인할 수 있습니다.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
              {/* 설비 탭 사이드바 */}
              <div className="md:w-56 shrink-0">
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
                  {uniqueEquipmentIds.map(eqId => {
                    const eq = EQUIPMENT_LIST.find(e => e.id === eqId)
                    const verdict = selectedInspection.equipmentReviews[eqId]?.result ?? ''
                    const active = activeEquipmentId === eqId
                    return (
                      <button
                        key={eqId}
                        onClick={() => setActiveEquipmentId(eqId)}
                        className={`shrink-0 md:shrink md:w-full px-3 py-2.5 rounded-lg border transition-all flex items-center gap-2 text-left text-sm ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : verdict === '검수완료'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : verdict === '보완'
                            ? 'bg-orange-50 border-orange-200 text-orange-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {verdict === '검수완료' ? (
                          <CheckCircle size={14} className={active ? 'text-white' : 'text-green-600'} />
                        ) : verdict === '보완' ? (
                          <AlertTriangle size={14} className={active ? 'text-white' : 'text-orange-500'} />
                        ) : (
                          <Circle size={14} className={active ? 'text-white' : 'text-gray-300'} />
                        )}
                        <span className="text-xs leading-tight whitespace-nowrap md:whitespace-normal">
                          {eq?.name ?? eqId}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 본문 */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>{selectedBuilding?.name}</h2>
                      <p className="text-sm mt-1" style={{ color: '#7a7a7a' }}>
                        [{selectedInspection.inspectionType}] {selectedInspection.inspectionDate}
                        &nbsp;·&nbsp;{selectedBuilding?.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${INSPECTION_STATUS_STYLE[selectedInspection.status]}`}>
                        {selectedInspection.status}
                      </span>
                      {user?.role === 'admin' && selectedInspection.status === '검수완료' && (
                        <button
                          onClick={handleReopenForReview}
                          className="btn-secondary text-xs flex items-center gap-1"
                          disabled={saving}
                        >
                          <RotateCcw size={12} />재검수
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {activeEquipmentId && equipmentGroups[activeEquipmentId] && (
                  <EquipmentReviewDetail
                    key={activeEquipmentId}
                    equipmentId={activeEquipmentId}
                    items={equipmentGroups[activeEquipmentId]}
                    review={selectedInspection.equipmentReviews[activeEquipmentId]}
                    locked={selectedInspection.status === '검수완료'}
                    saving={saving}
                    onReview={(result, note) => handleEquipmentReview(activeEquipmentId, result, note)}
                    onZoomPhoto={setZoomPhoto}
                  />
                )}

                {/* 종합의견 + 최종 검수완료 */}
                <div className="card">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1d1d1f' }}>
                    종합의견
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="전체 점검표에 대한 종합의견을 입력하세요"
                    disabled={selectedInspection.status === '검수완료'}
                  />
                  {selectedInspection.status !== '검수완료' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleSaveNote} className="btn-secondary text-sm" disabled={saving}>의견 저장</button>
                      <button
                        onClick={handleFinalApprove}
                        className="btn-primary text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={saving || !allEquipmentApproved}
                        title={!allEquipmentApproved ? '모든 설비의 검수가 완료되어야 합니다.' : undefined}
                      >
                        <CheckCircle size={14} />최종 검수완료
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사진 확대 팝업 */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
            onClick={() => setZoomPhoto(null)}
          >
            <X size={22} />
          </button>
          <img
            src={zoomPhoto}
            alt="점검사진 확대"
            className="max-w-full max-h-full rounded-lg"
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function EquipmentReviewDetail({
  equipmentId,
  items,
  review,
  locked,
  saving,
  onReview,
  onZoomPhoto,
}: {
  equipmentId: string
  items: InspectionItem[]
  review: EquipmentReview | undefined
  locked: boolean
  saving: boolean
  onReview: (result: '보완' | '검수완료', note: string) => void
  onZoomPhoto: (dataUrl: string) => void
}) {
  const eq = EQUIPMENT_LIST.find(e => e.id === equipmentId)
  const [note, setNote] = useState(review?.note ?? '')
  const badCount = items.reduce((n, item) => n + item.locations.filter(l => l.result === '부적합').length, 0)

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium" style={{ color: '#1d1d1f' }}>{eq?.name}</h3>
          {badCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">부적합 {badCount}건</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {items.map(item => (
            <div key={item.id} style={{ border: '1px solid #f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div className="px-3 py-2" style={{ backgroundColor: '#f5f5f7' }}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    item.subCategory === '외관' ? 'bg-gray-200 text-gray-700' :
                    item.subCategory === '기능' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-50 text-red-700'
                  }`}>{item.subCategory}</span>
                  <span style={{ color: '#1d1d1f' }}>{item.content}</span>
                </div>
                {item.method && item.method.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {item.method.map((m, i) => (
                      <li
                        key={i}
                        className="text-xs leading-relaxed"
                        style={{ color: m.startsWith('※') ? '#c2410c' : '#7a7a7a' }}
                      >
                        {m.startsWith('※') ? m : `· ${m}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {item.locations.map(loc => (
                <div key={loc.id} className="px-3 py-2" style={{ borderTop: '1px solid #f5f5f7' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#7a7a7a' }}>{loc.location || '위치 미입력'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      loc.result === '적합' ? 'bg-green-50 text-green-700' :
                      loc.result === '부적합' ? 'bg-red-50 text-red-700' :
                      loc.result === '해당없음' ? 'bg-gray-100 text-gray-500' :
                      'bg-gray-100 text-gray-400'
                    }`}>{loc.result || '미입력'}</span>
                  </div>
                  {loc.opinion && <p className="text-xs" style={{ color: '#7a7a7a' }}>의견: {loc.opinion}</p>}
                  {loc.photos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {loc.photos.map(p => (
                        <img
                          key={p.id}
                          src={p.dataUrl}
                          alt=""
                          className="w-14 h-14 object-cover rounded cursor-pointer"
                          style={{ border: '1px solid #e0e0e0' }}
                          onClick={() => onZoomPhoto(p.dataUrl)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {!locked && (
        <div className="card">
          <label className="block text-sm font-medium mb-1" style={{ color: '#1d1d1f' }}>
            설비별 검수 의견 / 보완 사유
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field text-sm resize-none"
            rows={2}
            placeholder="검수 의견 또는 보완이 필요한 사항을 입력하세요"
          />
          <div className="flex items-center gap-2 mt-3">
            {review?.result && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                review.result === '검수완료' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                현재: {review.result}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={() => onReview('보완', note)} className="btn-danger text-sm flex items-center gap-1" disabled={saving}>
                <AlertTriangle size={14} />보완 필요
              </button>
              <button onClick={() => onReview('검수완료', note)} className="btn-primary text-sm flex items-center gap-1" disabled={saving}>
                <CheckCircle size={14} />검수 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
