import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, ChevronRight, MessageSquare, ArrowLeft, X } from 'lucide-react'
import { inspectionsApi, buildingsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { InspectionForm, Building } from '../types'

export default function InspectionReview() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const paramBuildingId = searchParams.get('buildingId') ?? ''
  const paramInspectionId = searchParams.get('inspectionId') ?? ''

  const [inspections, setInspections] = useState<InspectionForm[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(paramInspectionId || null)
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
    }
  }, [inspections, paramInspectionId])

  const reviewTargets = useMemo(() => {
    const base = inspections.filter(
      i => i.status === '작성완료' || i.status === '점검표보완' || i.status === '검수완료'
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

  const handleSelect = (insp: InspectionForm) => {
    setSelectedId(insp.id)
    setReviewNote(insp.reviewNote)
  }

  const handleApprove = async () => {
    if (!selectedInspection) return
    if (!window.confirm('검수 완료 처리하시겠습니까?')) return
    setSaving(true)
    try {
      const updated = await inspectionsApi.update(selectedInspection.id, { status: '검수완료', reviewNote })
      setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))
      if (selectedBuilding) {
        await buildingsApi.update(selectedBuilding.id, { status: '검수완료' })
        setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, status: '검수완료' } : b))
      }
      alert('검수 완료 처리되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSupplement = async () => {
    if (!selectedInspection) return
    if (!reviewNote.trim()) { alert('보완 사유를 입력해주세요.'); return }
    if (!window.confirm('보완 필요로 처리하시겠습니까?')) return
    setSaving(true)
    try {
      const updated = await inspectionsApi.update(selectedInspection.id, { status: '점검표보완', reviewNote })
      setInspections(prev => prev.map(i => i.id === updated.id ? updated : i))
      if (selectedBuilding) {
        await buildingsApi.update(selectedBuilding.id, { status: '점검표보완' })
        setBuildings(prev => prev.map(b => b.id === selectedBuilding.id ? { ...b, status: '점검표보완' } : b))
      }
      alert('보완 필요로 처리되었습니다.')
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        insp.status === '검수완료' ? 'bg-green-100 text-green-700' :
                        insp.status === '점검표보완' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{insp.status}</span>
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
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold" style={{ color: '#1d1d1f' }}>{selectedBuilding?.name}</h2>
                    <p className="text-sm mt-1" style={{ color: '#7a7a7a' }}>
                      [{selectedInspection.inspectionType}] {selectedInspection.inspectionDate}
                      &nbsp;·&nbsp;{selectedBuilding?.address}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    selectedInspection.status === '검수완료' ? 'bg-green-100 text-green-700' :
                    selectedInspection.status === '점검표보완' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{selectedInspection.status}</span>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1d1d1f' }}>
                    검수 의견 / 보완 사유
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="검수 의견 또는 보완이 필요한 사항을 입력하세요"
                    disabled={selectedInspection.status === '검수완료'}
                  />
                </div>

                {selectedInspection.status !== '검수완료' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSaveNote} className="btn-secondary text-sm" disabled={saving}>의견 저장</button>
                    <button onClick={handleSupplement} className="btn-danger text-sm flex items-center gap-1" disabled={saving}>
                      <AlertTriangle size={14} />보완 필요
                    </button>
                    <button onClick={handleApprove} className="btn-primary text-sm flex items-center gap-1" disabled={saving}>
                      <CheckCircle size={14} />검수 완료
                    </button>
                  </div>
                )}
              </div>

              {Object.entries(
                selectedInspection.items.reduce<Record<string, typeof selectedInspection.items>>((acc, item) => {
                  if (!acc[item.equipmentId]) acc[item.equipmentId] = []
                  acc[item.equipmentId].push(item)
                  return acc
                }, {})
              ).map(([eqId, items]) => {
                const eq = EQUIPMENT_LIST.find(e => e.id === eqId)
                const badCount = items.reduce((n, item) =>
                  n + item.locations.filter(l => l.result === '부적합').length, 0)
                return (
                  <div key={eqId} className="card">
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
                                      onClick={() => setZoomPhoto(p.dataUrl)}
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
                )
              })}
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
