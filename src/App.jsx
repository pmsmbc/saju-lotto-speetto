import { useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import LottoPage from './pages/LottoPage.jsx'
import ZodiacPage from './pages/ZodiacPage.jsx'
import FortunePage from './pages/FortunePage.jsx'
import SajuPage from './pages/SajuPage.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

const TABS = [
  { id: 'fortune', label: '오늘의 운세', ready: true },
  { id: 'zodiac', label: '띠별 번호', ready: true },
  { id: 'saju', label: '사주 번호', ready: true },
  { id: 'lotto', label: '로또 추천', ready: true },
  { id: 'speetto', label: '스피또 지역', ready: true },
]

export default function App() {
  const [tab, setTab] = useState('fortune')

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
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {!t.ready && <span className="nav-tab-badge">준비중</span>}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {tab === 'fortune' && <FortunePage />}
        {tab === 'speetto' && <SpeettoPage />}
        {tab === 'lotto' && <LottoPage />}
        {tab === 'zodiac' && <ZodiacPage />}
        {tab === 'saju' && <SajuPage />}
      </main>
      <Footer />
    </div>
  )
}
