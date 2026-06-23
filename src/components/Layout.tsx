import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  ClipboardCheck,
  Wrench,
  Sparkles,
  HardHat,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { path: '/building-register', label: '건축물 등록', icon: Building2 },
  { path: '/inspection', label: '점검표 작성', icon: ClipboardList },
  { path: '/inspection-review', label: '점검표 검수', icon: ClipboardCheck },
  { path: '/buildings', label: '건축물 관리', icon: Wrench },
  { path: '/ai-generate', label: 'AI생성', icon: Sparkles },
  { path: '/technicians', label: '기술자관리', icon: HardHat },
  { path: '/users', label: '사용자관리', icon: Users },
]

// 모바일 하단 탭에 표시할 주요 메뉴 (4개)
const MOBILE_TAB_ITEMS = [
  { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { path: '/inspection', label: '점검표', icon: ClipboardList },
  { path: '/buildings', label: '건축물', icon: Wrench },
  { path: '/inspection-review', label: '검수', icon: ClipboardCheck },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false) // 모바일 슬라이드 메뉴
  const [desktopCollapsed, setDesktopCollapsed] = useState(false) // PC 사이드바 접기

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = {
    admin: '관리자',
    reviewer: '검토자',
    inspector: '점검자',
  }[user?.role ?? 'inspector']

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const currentLabel = NAV_ITEMS.find(n => isActive(n.path))?.label ?? '정보통신설비 유지보수관리'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ───────── PC 사이드바 (md 이상) ───────── */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-white transition-all duration-200 shrink-0
          ${desktopCollapsed ? 'w-16' : 'w-60'}`}
      >
        {/* 로고 */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
          {!desktopCollapsed && (
            <span className="font-bold text-sm leading-tight text-blue-300">
              정보통신설비<br />유지보수관리
            </span>
          )}
          <button
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="text-slate-400 hover:text-white p-1 rounded ml-auto"
          >
            {desktopCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* 내비 */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                title={desktopCollapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm transition-colors
                  ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <Icon size={18} className="shrink-0" />
                {!desktopCollapsed && (
                  <>
                    <span className="flex-1 text-xs leading-tight">{label}</span>
                    {active && <ChevronRight size={14} />}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 사용자 */}
        <div className="border-t border-slate-700 p-3">
          {!desktopCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400">{roleLabel}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 ml-2" title="로그아웃">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 w-full flex justify-center" title="로그아웃">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ───────── 모바일 슬라이드 오버레이 메뉴 ───────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* 배경 딤 */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />

          {/* 메뉴 패널 */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 text-white flex flex-col z-50">
            {/* 헤더 */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
              <span className="font-bold text-sm text-blue-300">
                정보통신설비 유지보수관리
              </span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>

            {/* 내비 */}
            <nav className="flex-1 py-3 overflow-y-auto">
              {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                const active = isActive(path)
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors
                      ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span>{label}</span>
                    {active && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                )
              })}
            </nav>

            {/* 로그아웃 */}
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-slate-700 rounded-lg"
              >
                <LogOut size={18} />로그아웃
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ───────── 메인 콘텐츠 영역 ───────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 shrink-0 gap-3">
          {/* 모바일 햄버거 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700 p-1"
          >
            <Menu size={22} />
          </button>

          <h1 className="text-sm md:text-base font-semibold text-gray-700 truncate">
            {currentLabel}
          </h1>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto p-3 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ───────── 모바일 하단 탭바 ───────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-30">
        <div className="flex">
          {MOBILE_TAB_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors
                  ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                <span className={`${active ? 'font-semibold' : ''}`}>{label}</span>
              </Link>
            )
          })}
          {/* 전체 메뉴 버튼 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs text-gray-400 hover:text-gray-600"
          >
            <Menu size={22} strokeWidth={1.5} />
            <span>전체</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
