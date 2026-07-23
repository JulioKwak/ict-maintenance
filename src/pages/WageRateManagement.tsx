import { useState, useEffect, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, Banknote } from 'lucide-react'
import { wageRatesApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useModal } from '../context/ModalContext'
import { canDelete, canEditSystemSettings } from '../utils/permissions'
import type { WageRateSet, TechnicianGrade } from '../types'

const GRADES: TechnicianGrade[] = ['특급기술자', '고급기술자', '중급기술자', '초급기술자']

const emptyRates = (): Record<TechnicianGrade, string> =>
  Object.fromEntries(GRADES.map(g => [g, ''])) as Record<TechnicianGrade, string>

export default function WageRateManagement() {
  const { user } = useAuth()
  const { alert: showAlert, confirm: showConfirm } = useModal()
  const canEdit = canEditSystemSettings(user?.role)
  const [wageRateSets, setWageRateSets] = useState<WageRateSet[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingYear, setEditingYear] = useState<number | null>(null)
  const [formYear, setFormYear] = useState('')
  const [formRates, setFormRates] = useState<Record<TechnicianGrade, string>>(emptyRates())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    wageRatesApi.getAll().then(setWageRateSets).catch(() => {})
  }, [])

  const openAdd = () => {
    setEditingYear(null)
    const latest = wageRateSets[0]
    setFormYear(String((latest?.year ?? new Date().getFullYear()) + 1))
    setFormRates(latest
      ? Object.fromEntries(GRADES.map(g => [g, String(latest.rates[g] ?? '')])) as Record<TechnicianGrade, string>
      : emptyRates())
    setShowForm(true)
  }

  const openEdit = (set: WageRateSet) => {
    setEditingYear(set.year)
    setFormYear(String(set.year))
    setFormRates(Object.fromEntries(GRADES.map(g => [g, String(set.rates[g] ?? '')])) as Record<TechnicianGrade, string>)
    setShowForm(true)
  }

  const closeForm = () => setShowForm(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const year = Number(formYear)
    if (!year) { await showAlert('연도를 입력하세요.'); return }
    if (editingYear === null && wageRateSets.some(s => s.year === year)) {
      await showAlert('이미 등록된 연도입니다.')
      return
    }
    const rates = Object.fromEntries(GRADES.map(g => [g, Number(formRates[g]) || 0])) as Record<TechnicianGrade, number>

    setSaving(true)
    try {
      const updated = await wageRatesApi.upsert(year, rates)
      setWageRateSets(prev => [...prev.filter(s => s.year !== year), updated].sort((a, b) => b.year - a.year))
      closeForm()
    } catch (err) {
      await showAlert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (year: number) => {
    if (!(await showConfirm(`${year}년 노임단가를 삭제하시겠습니까?`))) return
    try {
      await wageRatesApi.delete(year)
      setWageRateSets(prev => prev.filter(s => s.year !== year))
    } catch (err) {
      await showAlert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">노임단가 목록</h2>
          {canEdit && (
            <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={14} />연도 추가
            </button>
          )}
        </div>

        {wageRateSets.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Banknote size={32} className="mx-auto mb-2 opacity-40" />
            <p>등록된 노임단가가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  <th className="text-left py-2.5 text-[#7a7a7a] font-medium">연도</th>
                  {GRADES.map(g => (
                    <th key={g} className="text-right py-2.5 text-[#7a7a7a] font-medium whitespace-nowrap">{g}</th>
                  ))}
                  <th className="text-right py-2.5 text-[#7a7a7a] font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {wageRateSets.map(set => (
                  <tr key={set.year} className="border-b border-[#f0f0f0] hover:bg-[#f5f5f7]">
                    <td className="py-3 font-semibold text-[#1d1d1f] whitespace-nowrap">{set.year}년</td>
                    {GRADES.map(g => (
                      <td key={g} className="py-3 text-right text-[#333333] whitespace-nowrap">
                        {(set.rates[g] ?? 0).toLocaleString()}원
                      </td>
                    ))}
                    <td className="py-3 text-right whitespace-nowrap">
                      {canEdit && (
                        <button onClick={() => openEdit(set)} className="p-1 mr-1" style={{ color: '#0066cc' }}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete(user?.role) && (
                        <button onClick={() => handleDelete(set.year)} className="p-1" style={{ color: '#ff3b30' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md" style={{ borderRadius: '18px', border: '1px solid #e0e0e0' }}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900">{editingYear === null ? '노임단가 등록' : `${editingYear}년 노임단가 수정`}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연도 *</label>
                <input
                  type="number"
                  value={formYear}
                  onChange={e => setFormYear(e.target.value)}
                  className="input-field"
                  placeholder="예: 2027"
                  disabled={editingYear !== null}
                  required
                />
              </div>
              {GRADES.map(g => (
                <div key={g}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{g} 노임단가 (원) *</label>
                  <input
                    type="number"
                    value={formRates[g]}
                    onChange={e => setFormRates(f => ({ ...f, [g]: e.target.value }))}
                    className="input-field"
                    placeholder="일 노임단가"
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 disabled:opacity-60" disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
