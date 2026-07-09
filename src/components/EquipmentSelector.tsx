import { useState } from 'react'
import { Plus, Minus, CheckCircle2, X } from 'lucide-react'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { EquipmentCategory } from '../types'

const CATEGORIES: EquipmentCategory[] = ['통신설비', '방송설비', '정보설비', '기타설비']

interface Props {
  checkedEquipment: Record<string, boolean>
  equipmentQty: Record<string, number>
  onChange: (checked: Record<string, boolean>, qty: Record<string, number>) => void
}

// 통신/방송/정보/기타설비 4개 카드로 대상설비를 보여주고, 카드를 누르면 세부 설비를
// 팝업으로 선택할 수 있게 하는 컴포넌트. 팝업의 "적용"을 눌러야 실제 선택값(onChange)이 반영된다.
export default function EquipmentSelector({ checkedEquipment, equipmentQty, onChange }: Props) {
  const [openCategoryModal, setOpenCategoryModal] = useState<EquipmentCategory | null>(null)
  const [draftChecked, setDraftChecked] = useState<Record<string, boolean>>({})
  const [draftQty, setDraftQty] = useState<Record<string, number>>({})

  const openEquipmentModal = (cat: EquipmentCategory) => {
    setDraftChecked({ ...checkedEquipment })
    setDraftQty({ ...equipmentQty })
    setOpenCategoryModal(cat)
  }

  const closeEquipmentModal = () => setOpenCategoryModal(null)

  const toggleDraftEquipment = (id: string) => {
    setDraftChecked(prev => {
      const nextChecked = !prev[id]
      if (nextChecked) {
        setDraftQty(q => ({ ...q, [id]: q[id] || 1 }))
      }
      return { ...prev, [id]: nextChecked }
    })
  }

  const changeDraftQty = (id: string, delta: number) => {
    setDraftQty(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }))
  }

  const selectAllInCategory = (cat: EquipmentCategory) => {
    const ids = EQUIPMENT_LIST.filter(eq => eq.category === cat).map(eq => eq.id)
    setDraftChecked(prev => {
      const next = { ...prev }
      ids.forEach(id => { next[id] = true })
      return next
    })
    setDraftQty(prev => {
      const next = { ...prev }
      ids.forEach(id => { if (!next[id]) next[id] = 1 })
      return next
    })
  }

  const clearAllInCategory = (cat: EquipmentCategory) => {
    const ids = EQUIPMENT_LIST.filter(eq => eq.category === cat).map(eq => eq.id)
    setDraftChecked(prev => {
      const next = { ...prev }
      ids.forEach(id => { next[id] = false })
      return next
    })
  }

  const applyEquipmentModal = () => {
    onChange(draftChecked, draftQty)
    setOpenCategoryModal(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => {
          const selectedNames = EQUIPMENT_LIST
            .filter(eq => eq.category === cat && checkedEquipment[eq.id])
            .map(eq => eq.name)
          return (
            <div
              key={cat}
              onClick={() => openEquipmentModal(cat)}
              className="border rounded-xl p-4 cursor-pointer transition-colors border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 text-sm">{cat}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap">
                  {selectedNames.length}개 선택
                </span>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                {selectedNames.length > 0 ? selectedNames.join(', ') : '선택된 설비가 없습니다'}
              </div>
            </div>
          )
        })}
      </div>

      {openCategoryModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeEquipmentModal}
        >
          <div
            className="bg-white w-full max-w-lg flex flex-col"
            style={{ borderRadius: '18px', border: '1px solid #e0e0e0', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>{openCategoryModal} 설비 선택</h3>
              <button type="button" onClick={closeEquipmentModal} style={{ color: '#7a7a7a' }}><X size={20} /></button>
            </div>

            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
              <span className="text-xs text-gray-500">
                {EQUIPMENT_LIST.filter(eq => eq.category === openCategoryModal && draftChecked[eq.id]).length}
                {' / '}
                {EQUIPMENT_LIST.filter(eq => eq.category === openCategoryModal).length}개 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectAllInCategory(openCategoryModal)}
                  className="btn-secondary text-xs"
                  style={{ padding: '6px 12px' }}
                >
                  전체선택
                </button>
                <button
                  type="button"
                  onClick={() => clearAllInCategory(openCategoryModal)}
                  className="btn-secondary text-xs"
                  style={{ padding: '6px 12px' }}
                >
                  전체해제
                </button>
              </div>
            </div>

            <div className="p-5 space-y-2 overflow-y-auto">
              {EQUIPMENT_LIST.filter(eq => eq.category === openCategoryModal).map(eq => (
                <div
                  key={eq.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    draftChecked[eq.id]
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleDraftEquipment(eq.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      draftChecked[eq.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {draftChecked[eq.id] && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-800">{eq.name}</span>
                  </div>
                  {draftChecked[eq.id] && !eq.applyAdjustment && (
                    <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => changeDraftQty(eq.id, -1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{draftQty[eq.id] || 1}</span>
                      <button
                        type="button"
                        onClick={() => changeDraftQty(eq.id, 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="text-xs text-gray-500">{eq.unit}</span>
                    </div>
                  )}
                  {draftChecked[eq.id] && eq.applyAdjustment && (
                    <span className="text-xs text-gray-400 ml-2">1식</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid #f0f0f0' }}>
              <button type="button" onClick={applyEquipmentModal} className="btn-primary flex-1">적용</button>
              <button type="button" onClick={closeEquipmentModal} className="btn-secondary flex-1">취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
