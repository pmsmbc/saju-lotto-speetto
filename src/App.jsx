import { useEffect, useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import LottoPage from './pages/LottoPage.jsx'
import ZodiacPage from './pages/ZodiacPage.jsx'
import FortunePage from './pages/FortunePage.jsx'
import GunghapPage from './pages/GunghapPage.jsx'
import SajuPage from './pages/SajuPage.jsx'
import Footer from './components/Footer.jsx'
import FloatingShare from './components/FloatingShare.jsx'
import InfoPage from './pages/InfoPage.jsx'
import './App.css'

// 경로 ↔ 화면 매핑 (scripts/make-routes.js 와 함께 유지)
const ROUTES = {
  '/unse': { menu: 'saju', tab: 'fortune' },
  '/gunghap': { menu: 'saju', tab: 'gunghap' },
  '/zodiac': { menu: 'lotto', tab: 'zodiac' },
  '/saju': { menu: 'lotto', tab: 'sajunum' },
  '/lotto': { menu: 'lotto', tab: 'lottorec' },
  '/speetto': { menu: 'speetto', tab: 'speetto' },
}
const PATH_OF = {
  ...Object.fromEntries(Object.entries(ROUTES).map(([path, r]) => [r.tab, path])),
  info: '/info',
}

function stateFromPath(pathname) {
  if (pathname.startsWith('/info')) return { menu: 'info', tab: 'info' }
  return ROUTES[pathname.replace(/\/$/, '')] ?? ROUTES['/unse']
}

const MENUS = [
  {
    id: 'saju', label: '사주',
    items: [
      { id: 'fortune', label: '오늘의 운세' },
      { id: 'gunghap', label: '궁합' },
    ],
  },
  {
    id: 'lotto', label: '로또',
    items: [
      { id: 'zodiac', label: '띠별 번호' },
      { id: 'sajunum', label: '사주 번호' },
      { id: 'lottorec', label: '로또 추천' },
    ],
  },
  {
    id: 'speetto', label: '스피또',
    items: [{ id: 'speetto', label: '당첨 지역' }],
  },
  {
    id: 'info', label: '정보',
    items: [{ id: 'info', label: '꿈해몽' }],
  },
]

export default function App() {
  const initial = stateFromPath(window.location.pathname)
  const [menuId, setMenuId] = useState(initial.menu)
  // 대메뉴별 마지막 선택 하위 메뉴 기억
  const [subByMenu, setSubByMenu] = useState({
    saju: 'fortune', lotto: 'zodiac', speetto: 'speetto', info: 'info',
    [initial.menu]: initial.tab,
  })
  const menu = MENUS.find((m) => m.id === menuId)
  const tab = subByMenu[menuId]

  // 주소 반영 + 뒤로가기 지원
  const navigate = (nextMenu, nextTab) => {
    setMenuId(nextMenu)
    setSubByMenu((prev) => ({ ...prev, [nextMenu]: nextTab }))
    const path = PATH_OF[nextTab]
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', path + window.location.search)
      // InfoPage 등 하위 라우터가 경로 변화를 인지하도록
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  useEffect(() => {
    const onPop = () => {
      const st = stateFromPath(window.location.pathname)
      setMenuId(st.menu)
      setSubByMenu((prev) => ({ ...prev, [st.menu]: st.tab }))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img src="/logo.png" alt="" className="app-logo" />
          <h1 className="app-title">
            <span className="title-big">사</span>
            <span className="title-small">주 로또 스피</span>
            <span className="title-big">또</span>
          </h1>
        </div>
      </header>
      <nav className="app-nav">
        {MENUS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={m.id === menuId ? 'nav-tab active' : 'nav-tab'}
            onClick={() => navigate(m.id, subByMenu[m.id])}
          >
            {m.label}
          </button>
        ))}
      </nav>
      {menu.items.length > 1 && (
        <nav className="sub-nav">
          {menu.items.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'sub-tab active' : 'sub-tab'}
              onClick={() => navigate(menuId, t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
      <main className="app-main">
        {tab === 'fortune' && <FortunePage />}
        {tab === 'gunghap' && <GunghapPage />}
        {tab === 'zodiac' && <ZodiacPage />}
        {tab === 'sajunum' && <SajuPage />}
        {tab === 'lottorec' && <LottoPage />}
        {tab === 'speetto' && <SpeettoPage />}
        {tab === 'info' && <InfoPage />}
      </main>
      <Footer />
      <FloatingShare />
    </div>
  )
}
