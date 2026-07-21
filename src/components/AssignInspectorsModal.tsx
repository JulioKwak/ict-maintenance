import { useState, useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { usersApi } from '../utils/api'
import type { User } from '../types'

interface Props {
  isOpen: boolean
  selectedIds: string[]
  onClose: () => void
  onApply: (ids: string[]) => void
}

// 등록된 사용자 중 '점검자' 권한만 골라 여러 명을 체크박스로 선택하는 팝업.
// "적용"을 눌러야 실제 선택값(onApply)이 반영된다 (EquipmentSelector와 동일한 draft/apply 패턴).
export default function AssignInspectorsModal({ isOpen, selectedIds, onClose, onApply }: Props) {
  const [inspectors, setInspectors] = useState<User[]>([])
  const [draftSelected, setDraftSelected] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isOpen) return
    setDraftSelected(Object.fromEntries(selectedIds.map(id => [id, true])))
    usersApi.getAll()
      .then(users => setInspectors(users.filter(u => u.role === 'inspector')))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const toggle = (id: string) => {
    setDraftSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const selectAll = () => {
    setDraftSelected(Object.fromEntries(inspectors.map(u => [u.id, true])))
  }

  const clearAll = () => setDraftSelected({})

  const handleApply = () => {
    onApply(Object.keys(draftSelected).filter(id => draftSelected[id]))
    onClose()
  }

  const selectedCount = Object.values(draftSelected).filter(Boolean).length

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg flex flex-col"
        style={{ borderRadius: '18px', border: '1px solid #e0e0e0', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>점검자 지정</h3>
          <button type="button" onClick={onClose} style={{ color: '#7a7a7a' }}><X size={20} /></button>
        </div>

        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <span className="text-xs text-gray-500">{selectedCount} / {inspectors.length}명 선택됨</span>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="btn-secondary text-xs" style={{ padding: '6px 12px' }}>전체선택</button>
            <button type="button" onClick={clearAll} className="btn-secondary text-xs" style={{ padding: '6px 12px' }}>전체해제</button>
          </div>
        </div>

        <div className="p-5 space-y-2 overflow-y-auto">
          {inspectors.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#7a7a7a' }}>
              등록된 점검자 권한 사용자가 없습니다.
            </p>
          ) : (
            inspectors.map(u => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  draftSelected[u.id] ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggle(u.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    draftSelected[u.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {draftSelected[u.id] && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-800">{u.name}</span>
                </div>
                <span className="text-xs text-gray-400">{u.username}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button type="button" onClick={handleApply} className="btn-primary flex-1">적용</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">취소</button>
        </div>
      </div>
    </div>
  )
}
