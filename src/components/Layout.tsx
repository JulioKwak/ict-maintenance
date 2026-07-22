import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Sparkles,
  HardHat,
  Users,
  ClipboardList,
  Settings,
  Banknote,
  Briefcase,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { canAccessPath } from '../utils/permissions'

const NAV_ITEMS = [
  { path: '/dashboard',         label: '대시보드',    icon: LayoutDashboard },
  { path: '/building-register', label: '건축물 등록', icon: Building2 },
  { path: '/buildings',         label: '건축물 관리', icon: Wrench },
  { path: '/my-inspections',    label: '점검표 작성', icon: ClipboardList },
  { path: '/ai-generate',       label: 'AI 생성',    icon: Sparkles },
  { path: '/resources',         label: '자료실',     icon: FolderOpen },
  { path: '/technicians',       label: '기술자 관리', icon: HardHat },
  { path: '/users',             label: '사용자 관리', icon: Users },
]

const SYSTEM_GROUP = {
  label: '시스템 관리',
  icon: Settings,
  children: [
    { path: '/wage-rates', label: '노임단가 관리', icon: Banknote },
    { path: '/company',    label: '회사 관리',     icon: Briefcase },
  ],
}

const MOBILE_TAB_ITEMS = [
  { path: '/dashboard',         label: '대시보드', icon: LayoutDashboard },
  { path: '/buildings',         label: '건축물',   icon: Wrench },
  { path: '/my-inspections',    label: '점검표 작성', icon: ClipboardList },
  { path: '/ai-generate',       label: 'AI생성',   icon: Sparkles },
  { path: '/technicians',       label: '기술자',   icon: HardHat },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [systemOpen, setSystemOpen] = useState(
    () => SYSTEM_GROUP.children.some(c => location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = {
    admin:    '관리자',
    reviewer: '검토자',
    inspector: '점검자',
  }[user?.role ?? 'inspector']

  const visibleNavItems = NAV_ITEMS.filter(n => canAccessPath(user?.role, n.path))
  const visibleMobileTabItems = MOBILE_TAB_ITEMS.filter(n => canAccessPath(user?.role, n.path))
  const visibleSystemChildren = SYSTEM_GROUP.children.filter(n => canAccessPath(user?.role, n.path))

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const currentLabel = NAV_ITEMS.find(n => isActive(n.path))?.label
    ?? visibleSystemChildren.find(n => isActive(n.path))?.label
    ?? '정보통신설비 유지보수관리'

  const toggleSystemGroup = () => {
    if (desktopCollapsed) { setDesktopCollapsed(false); setSystemOpen(true) }
    else setSystemOpen(o => !o)
  }

  return (
    <div className="flex h-screen bg-[#f5f5f7] overflow-hidden">

      {/* ───────── PC 사이드바 ───────── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-200
          ${desktopCollapsed ? 'w-[60px]' : 'w-[220px]'}`}
        style={{ backgroundColor: '#000000' }}
      >
        {/* 로고 */}
        <div
          className={`flex items-center h-11 px-3 shrink-0 ${desktopCollapsed ? 'justify-center' : 'justify-between'}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {!desktopCollapsed && (
            <span className="text-white font-semibold leading-tight" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
              정보통신설비<br />유지보수관리
            </span>
          )}
          <button
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="rounded-md p-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            {desktopCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* 내비 */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleNavItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                title={desktopCollapsed ? label : undefined}
                className="flex items-center gap-2.5 mx-1.5 my-0.5 px-2.5 py-2 rounded-[8px] transition-colors"
                style={{
                  color: active ? '#2997ff' : 'rgba(255,255,255,0.55)',
                  backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  fontSize: '12px',
                  letterSpacing: '-0.012px',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon size={16} className="shrink-0" />
                {!desktopCollapsed && (
                  <>
                    <span className="flex-1 leading-none">{label}</span>
                    {active && <ChevronRight size={12} style={{ color: 'rgba(41,151,255,0.7)' }} />}
                  </>
                )}
              </Link>
            )
          })}

          {visibleSystemChildren.length > 0 && (
            <div className="mx-1.5 my-0.5">
              <button
                onClick={toggleSystemGroup}
                title={desktopCollapsed ? SYSTEM_GROUP.label : undefined}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', letterSpacing: '-0.012px' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <SYSTEM_GROUP.icon size={16} className="shrink-0" />
                {!desktopCollapsed && (
                  <>
                    <span className="flex-1 text-left leading-none">{SYSTEM_GROUP.label}</span>
                    <ChevronDown size={12} style={{ transition: 'transform 0.15s', transform: systemOpen ? 'rotate(180deg)' : undefined }} />
                  </>
                )}
              </button>
              {systemOpen && !desktopCollapsed && visibleSystemChildren.map(({ path, label, icon: Icon }) => {
                const active = isActive(path)
                return (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center gap-2.5 ml-4 my-0.5 px-2.5 py-1.5 rounded-[8px] transition-colors"
                    style={{
                      color: active ? '#2997ff' : 'rgba(255,255,255,0.5)',
                      backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                      fontSize: '11.5px',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.backgroundColor = 'transparent' } }}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="flex-1 leading-none">{label}</span>
                    {active && <ChevronRight size={11} style={{ color: 'rgba(41,151,255,0.7)' }} />}
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* 사용자 */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!desktopCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-medium truncate" style={{ fontSize: '12px' }}>{user?.name}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md shrink-0 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                title="로그아웃"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-1.5 rounded-md transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              title="로그아웃"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* ───────── 모바일 슬라이드 오버레이 ───────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />

          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col z-50" style={{ backgroundColor: '#000000' }}>
            {/* 헤더 */}
            <div className="flex items-center justify-between h-11 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-white font-semibold" style={{ fontSize: '12px', letterSpacing: '-0.01em' }}>
                정보통신설비 유지보수관리
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <p className="text-white font-medium" style={{ fontSize: '13px' }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{roleLabel}</p>
            </div>

            {/* 내비 */}
            <nav className="flex-1 py-2 overflow-y-auto">
              {visibleNavItems.map(({ path, label, icon: Icon }) => {
                const active = isActive(path)
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-[8px] transition-colors"
                    style={{
                      color: active ? '#2997ff' : 'rgba(255,255,255,0.60)',
                      backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                      fontSize: '14px',
                    }}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight size={14} style={{ color: 'rgba(41,151,255,0.7)' }} />}
                  </Link>
                )
              })}

              {visibleSystemChildren.length > 0 && (
                <div className="mx-2 my-0.5">
                  <button
                    onClick={() => setSystemOpen(o => !o)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors"
                    style={{ color: 'rgba(255,255,255,0.60)', fontSize: '14px' }}
                  >
                    <SYSTEM_GROUP.icon size={18} className="shrink-0" />
                    <span className="flex-1 text-left">{SYSTEM_GROUP.label}</span>
                    <ChevronDown size={14} style={{ transition: 'transform 0.15s', transform: systemOpen ? 'rotate(180deg)' : undefined }} />
                  </button>
                  {systemOpen && visibleSystemChildren.map(({ path, label, icon: Icon }) => {
                    const active = isActive(path)
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 ml-5 my-0.5 px-3 py-2 rounded-[8px] transition-colors"
                        style={{
                          color: active ? '#2997ff' : 'rgba(255,255,255,0.55)',
                          backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                          fontSize: '13px',
                        }}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="flex-1">{label}</span>
                        {active && <ChevronRight size={13} style={{ color: 'rgba(41,151,255,0.7)' }} />}
                      </Link>
                    )
                  })}
                </div>
              )}
            </nav>

            {/* 로그아웃 */}
            <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors"
                style={{ color: '#ff3b30', fontSize: '14px' }}
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
        <header
          className="flex items-center px-5 shrink-0 gap-3"
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            height: '52px',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 transition-colors"
            style={{ color: '#7a7a7a' }}
          >
            <Menu size={20} />
          </button>
          <h1
            className="font-semibold truncate"
            style={{ fontSize: '15px', color: '#1d1d1f', letterSpacing: '-0.022em' }}
          >
            {currentLabel}
          </h1>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ───────── 모바일 하단 탭바 ───────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-30"
        style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e0e0e0' }}
      >
        <div className="flex">
          {visibleMobileTabItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                style={{
                  color: active ? '#0066cc' : '#7a7a7a',
                  fontSize: '10px',
                  letterSpacing: '-0.01em',
                }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={{ color: '#7a7a7a', fontSize: '10px' }}
          >
            <Menu size={22} strokeWidth={1.5} />
            <span>전체</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
