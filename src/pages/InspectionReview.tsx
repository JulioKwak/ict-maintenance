import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, AlertTriangle, ChevronRight, MessageSquare } from 'lucide-react'
import { inspectionsApi, buildingsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { InspectionForm, Building } from '../types'

export default function InspectionReview() {
  const [inspections, setInspections] = useState<InspectionForm[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    inspectionsApi.getAll().then(setInspections).catch(() => {})
    buildingsApi.getAll().then(setBuildings).catch(() => {})
  }, [])

  const reviewTargets = useMemo(
    () => inspections.filter(i => i.status === '작성완료' || i.status === '점검표보완' || i.status === '검수완료'),
    [inspections]
  )

  const selectedInspection = useMemo(
    () => inspections.find(i => i.id === selectedId) ?? null,
    [inspections, selectedId]
  )

  const selectedBuilding = useMemo(
    () => buildings.find(b => b.id === selectedInspection?.buildingId),
    [buildings, selectedInspection]
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
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[calc(100vh-7rem)]">
      {/* 목록 */}
      <div className="w-full md:w-80 shrink-0 md:overflow-y-auto space-y-2">
        <h2 className="font-semibold text-gray-800 mb-3">점검완료 목록</h2>
        {reviewTargets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">검수 대기 중인 점검표가 없습니다.</p>
        ) : (
          reviewTargets.map(insp => {
            const building = buildings.find(b => b.id === insp.buildingId)
            const active = selectedId === insp.id
            return (
              <button key={insp.id} onClick={() => handleSelect(insp)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  active ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{building?.name ?? '-'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">[{insp.inspectionType}] {insp.inspectionDate}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      insp.status === '검수완료' ? 'bg-green-100 text-green-700' :
                      insp.status === '점검표보완' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{insp.status}</span>
                    <ChevronRight size={14} className="text-gray-300" />
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
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p>점검표를 선택하면 내용을 확인할 수 있습니다.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedBuilding?.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    [{selectedInspection.inspectionType}] {selectedInspection.inspectionDate}
                    &nbsp;·&nbsp; {selectedBuilding?.address}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedInspection.status === '검수완료' ? 'bg-green-100 text-green-700' :
                  selectedInspection.status === '점검표보완' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{selectedInspection.status}</span>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">검수 의견 / 보완 사유</label>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                  className="input-field text-sm resize-none" rows={3}
                  placeholder="검수 의견 또는 보완이 필요한 사항을 입력하세요"
                  disabled={selectedInspection.status === '검수완료'} />
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
                n + item.locations.filter(l => l.result === '미흡').length, 0)
              return (
                <div key={eqId} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">{eq?.name}</h3>
                    {badCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">미흡 {badCount}건</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {items.map(item => (
                      <div key={item.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.subCategory === '외관' ? 'bg-gray-200 text-gray-700' :
                            item.subCategory === '기능' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-50 text-red-700'
                          }`}>{item.subCategory}</span>
                          <span className="text-gray-800">{item.content}</span>
                        </div>
                        {item.locations.map(loc => (
                          <div key={loc.id} className="px-3 py-2 border-t border-gray-50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">{loc.location || '위치 미입력'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                loc.result === '양호' ? 'bg-green-50 text-green-700' :
                                loc.result === '미흡' ? 'bg-red-50 text-red-700' :
                                'bg-gray-100 text-gray-400'
                              }`}>{loc.result || '미입력'}</span>
                            </div>
                            {loc.result === '미흡' && loc.deficiency && (
                              <p className="text-xs text-red-600 mb-1">미흡: {loc.deficiency}</p>
                            )}
                            {loc.opinion && <p className="text-xs text-gray-500">의견: {loc.opinion}</p>}
                            {loc.photos.length > 0 && (
                              <div className="flex gap-1.5 mt-2">
                                {loc.photos.map(p => (
                                  <img key={p.id} src={p.dataUrl} alt="" className="w-14 h-14 object-cover rounded" />
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
  )
}
