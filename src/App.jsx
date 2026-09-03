import { useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import LottoPage from './pages/LottoPage.jsx'
import ZodiacPage from './pages/ZodiacPage.jsx'
import FortunePage from './pages/FortunePage.jsx'
import GunghapPage from './pages/GunghapPage.jsx'
import SajuPage from './pages/SajuPage.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

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
]

export default function App() {
  const [menuId, setMenuId] = useState('saju')
  // 대메뉴별 마지막 선택 하위 메뉴 기억
  const [subByMenu, setSubByMenu] = useState({ saju: 'fortune', lotto: 'zodiac', speetto: 'speetto' })
  const menu = MENUS.find((m) => m.id === menuId)
  const tab = subByMenu[menuId]

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
            onClick={() => setMenuId(m.id)}
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
              onClick={() => setSubByMenu((prev) => ({ ...prev, [menuId]: t.id }))}
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
      </main>
      <Footer />
    </div>
  )
}
