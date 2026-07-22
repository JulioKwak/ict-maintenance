import { useState, useEffect, useRef } from 'react'
import { FolderOpen, Upload, Download, Trash2 } from 'lucide-react'
import { resourcesApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { canManageResources } from '../utils/permissions'
import type { ResourceFile } from '../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function ResourceLibrary() {
  const { user } = useAuth()
  const canManage = canManageResources(user?.role)
  const [files, setFiles] = useState<ResourceFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    resourcesApi.getAll().then(setFiles).catch(() => {})
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      const created = await resourcesApi.upload(file)
      setFiles(prev => [created, ...prev])
    } catch (err) {
      alert(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (file: ResourceFile) => {
    resourcesApi.download(file).catch(err => {
      alert(err instanceof Error ? err.message : '다운로드 중 오류가 발생했습니다.')
    })
  }

  const handleDelete = async (file: ResourceFile) => {
    if (!window.confirm(`"${file.filename}" 파일을 삭제하시겠습니까?`)) return
    try {
      await resourcesApi.delete(file.id)
      setFiles(prev => prev.filter(f => f.id !== file.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">자료실 ({files.length}개)</h2>
          {canManage && (
            <>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-60"
                disabled={uploading}
              >
                <Upload size={14} />{uploading ? '업로드 중...' : '파일 업로드'}
              </button>
            </>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
            <p>등록된 자료가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 모바일 카드 리스트 */}
            <div className="md:hidden divide-y divide-[#f0f0f0]">
              {files.map(f => (
                <div key={f.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#1d1d1f] text-sm truncate">{f.filename}</p>
                    <p className="text-xs text-[#7a7a7a] mt-0.5">
                      {formatBytes(f.size)} · {new Date(f.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-3">
                    <button onClick={() => handleDownload(f)} className="p-2" style={{ color: '#0066cc' }}>
                      <Download size={15} />
                    </button>
                    {canManage && (
                    <button onClick={() => handleDelete(f)} className="p-2" style={{ color: '#ff3b30' }}>
                      <Trash2 size={15} />
                    </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0f0]">
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">파일명</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">용량</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">업로더</th>
                    <th className="text-left py-2.5 text-[#7a7a7a] font-medium">등록일</th>
                    <th className="text-right py-2.5 text-[#7a7a7a] font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(f => (
                    <tr key={f.id} className="border-b border-[#f0f0f0] hover:bg-[#f5f5f7]">
                      <td className="py-3 font-medium text-[#1d1d1f]">{f.filename}</td>
                      <td className="py-3 text-[#333333] whitespace-nowrap">{formatBytes(f.size)}</td>
                      <td className="py-3 text-[#333333] whitespace-nowrap">{f.uploadedBy}</td>
                      <td className="py-3 text-[#333333] whitespace-nowrap">{new Date(f.createdAt).toLocaleDateString('ko-KR')}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button onClick={() => handleDownload(f)} className="p-1 mr-1" style={{ color: '#0066cc' }}>
                          <Download size={14} />
                        </button>
                        {canManage && (
                        <button onClick={() => handleDelete(f)} className="p-1" style={{ color: '#ff3b30' }}>
                          <Trash2 size={14} />
                        </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
