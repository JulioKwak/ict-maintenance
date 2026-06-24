import { useState, useEffect } from 'react'
import { Sparkles, Key, Info } from 'lucide-react'
import { buildingsApi } from '../utils/api'
import { EQUIPMENT_LIST } from '../data/equipment'
import type { Building } from '../types'

export default function AIGenerate() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [diagramType, setDiagramType] = useState<'계통도' | '구성도'>('계통도')
  const [apiKey, setApiKey] = useState(localStorage.getItem('ict_openai_key') || '')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    buildingsApi.getAll().then(setBuildings).catch(() => {})
  }, [])

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  const availableEquipment = selectedBuilding
    ? selectedBuilding.equipment
        .filter(e => e.checked)
        .map(e => EQUIPMENT_LIST.find(eq => eq.id === e.equipmentId))
        .filter((eq): eq is NonNullable<typeof eq> => Boolean(eq))
    : []

  const saveApiKey = () => {
    localStorage.setItem('ict_openai_key', apiKey)
    alert('API 키가 저장되었습니다.')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">AI 계통도/구성도 생성</p>
          <p>OpenAI GPT API를 활용하여 설비별 계통도 또는 구성도 이미지를 생성합니다.</p>
          <p className="mt-1">API 키를 입력하면 연동이 가능합니다.</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Key size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">OpenAI API 키 설정</h2>
        </div>
        <div className="flex gap-2">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="input-field flex-1 font-mono text-sm"
            placeholder="sk-..."
          />
          <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="btn-secondary text-sm shrink-0">
            {showApiKey ? '숨기기' : '표시'}
          </button>
          <button onClick={saveApiKey} className="btn-primary text-sm shrink-0">저장</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">API 키는 브라우저 로컬 스토리지에 저장됩니다.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-purple-500" />
          <h2 className="font-semibold text-gray-800">이미지 생성</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">건축물 선택</label>
            <select
              value={selectedBuildingId}
              onChange={e => { setSelectedBuildingId(e.target.value); setSelectedEquipmentId('') }}
              className="input-field"
            >
              <option value="">건축물을 선택하세요</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {selectedBuilding && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대상 설비 선택</label>
              <select
                value={selectedEquipmentId}
                onChange={e => setSelectedEquipmentId(e.target.value)}
                className="input-field"
              >
                <option value="">설비를 선택하세요</option>
                {availableEquipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">생성 유형</label>
            <div className="flex gap-3">
              {(['계통도', '구성도'] as const).map(type => (
                <button key={type} type="button" onClick={() => setDiagramType(type)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    diagramType === type ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!apiKey || !selectedBuildingId || !selectedEquipmentId}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => alert('API 연동 기능은 추후 구현 예정입니다.\nOpenAI API 키 입력 후 이용 가능합니다.')}
          >
            <Sparkles size={16} />
            {diagramType} 생성
          </button>

          {!apiKey && (
            <p className="text-xs text-center text-amber-600">API 키를 입력하면 이미지 생성이 가능합니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
