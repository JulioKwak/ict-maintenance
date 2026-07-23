import { useState, type FormEvent } from 'react'
import { Search, X, Loader2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { localSearchApi, type LocalSearchItem } from '../utils/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (address: string) => void
}

export default function AddressSearchModal({ isOpen, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocalSearchItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const runSearch = async (targetPage: number) => {
    setLoading(true)
    setSearched(true)
    setError('')
    try {
      const result = await localSearchApi.search(query.trim(), targetPage)
      setResults(result.items)
      setPage(result.page)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '주소 검색 중 오류가 발생했습니다.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    runSearch(1)
  }

  const handleSelect = (item: LocalSearchItem) => {
    onSelect(item.roadAddress || item.address)
    handleClose()
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    setPage(1)
    setTotalPages(1)
    setSearched(false)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white w-full max-w-lg flex flex-col"
        style={{ borderRadius: '18px', border: '1px solid #e0e0e0', maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h3 className="font-semibold" style={{ color: '#1d1d1f', fontSize: '15px' }}>주소 검색</h3>
          <button type="button" onClick={handleClose} style={{ color: '#7a7a7a' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 p-5 pb-3 shrink-0">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field text-sm"
            placeholder="도로명, 지번, 건물명으로 검색"
            autoFocus
          />
          <button type="submit" className="btn-primary flex items-center gap-1 text-sm px-4 shrink-0" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            검색
          </button>
        </form>

        <div className="px-5 pb-3 space-y-2 overflow-y-auto flex-1">
          {!searched ? (
            <p className="text-sm text-center py-8" style={{ color: '#7a7a7a' }}>주소 또는 건물명을 입력해 검색하세요.</p>
          ) : loading ? (
            <p className="text-sm text-center py-8" style={{ color: '#7a7a7a' }}>검색 중...</p>
          ) : error ? (
            <p className="text-sm text-center py-8" style={{ color: '#ff3b30' }}>{error}</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#7a7a7a' }}>검색 결과가 없습니다.</p>
          ) : (
            results.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3 border rounded-lg transition-colors border-gray-200 hover:border-blue-400 hover:bg-blue-50/40"
              >
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: '#0066cc' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1d1d1f' }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#7a7a7a' }}>{item.roadAddress || item.address}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {searched && !loading && !error && results.length > 0 && (
          <div className="flex items-center justify-center gap-4 p-3 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
            <button
              type="button"
              onClick={() => runSearch(page - 1)}
              disabled={page <= 1}
              className="flex items-center justify-center"
              style={{ width: '32px', height: '32px', borderRadius: '9999px', color: page <= 1 ? '#cccccc' : '#0066cc' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs" style={{ color: '#7a7a7a' }}>{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => runSearch(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center justify-center"
              style={{ width: '32px', height: '32px', borderRadius: '9999px', color: page >= totalPages ? '#cccccc' : '#0066cc' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
