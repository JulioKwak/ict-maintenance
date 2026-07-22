import { useState, useEffect, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { companyApi } from '../utils/api'
import { formatPhone } from '../utils/phone'
import { useAuth } from '../context/AuthContext'
import { canEditSystemSettings } from '../utils/permissions'
import AddressSearchModal from '../components/AddressSearchModal'
import type { CompanyInfo } from '../types'

const emptyForm = (): CompanyInfo => ({
  representativeName: '', address: '', phone: '', email: '', businessNumber: '', updatedAt: '',
})

export default function CompanyManagement() {
  const { user } = useAuth()
  const canEdit = canEditSystemSettings(user?.role)
  const [form, setForm] = useState<CompanyInfo>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [showAddressSearch, setShowAddressSearch] = useState(false)

  useEffect(() => {
    companyApi.get().then(setForm).catch(() => {})
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await companyApi.update(form)
      setForm(updated)
      alert('저장되었습니다.')
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b">회사 정보</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
            <input
              type="text"
              value={form.representativeName}
              onChange={e => setForm(f => ({ ...f, representativeName: e.target.value }))}
              className="input-field"
              placeholder="대표자명을 입력하세요"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="input-field"
                placeholder="회사 주소를 입력하세요"
                disabled={!canEdit}
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowAddressSearch(true)}
                  className="btn-secondary text-sm px-3 shrink-0 flex items-center gap-1"
                >
                  <Search size={14} />주소 검색
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
              className="input-field"
              placeholder="02-0000-0000"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="email@example.com"
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
            <input
              type="text"
              value={form.businessNumber}
              onChange={e => setForm(f => ({ ...f, businessNumber: e.target.value }))}
              className="input-field"
              placeholder="000-00-00000"
              disabled={!canEdit}
            />
          </div>
          {canEdit && (
            <div className="pt-2">
              <button type="submit" className="btn-primary px-8 disabled:opacity-60" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </form>
      </div>

      <AddressSearchModal
        isOpen={showAddressSearch}
        onClose={() => setShowAddressSearch(false)}
        onSelect={addr => setForm(f => ({ ...f, address: addr }))}
      />
    </div>
  )
}
