import { useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import LottoPage from './pages/LottoPage.jsx'
import ZodiacPage from './pages/ZodiacPage.jsx'
import SajuPage from './pages/SajuPage.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

const TABS = [
  { id: 'zodiac', label: '오늘의 띠별 번호', ready: true },
  { id: 'saju', label: '오늘의 사주 번호', ready: true },
  { id: 'lotto', label: '로또 번호 추천', ready: true },
  { id: 'speetto', label: '스피또 당첨 지역', ready: true },
]

export default function App() {
  const [tab, setTab] = useState('zodiac')

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img src="/logo.png" alt="" className="app-logo" />
          <h1 className="app-title">사또</h1>
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
        {tab === 'speetto' && <SpeettoPage />}
        {tab === 'lotto' && <LottoPage />}
        {tab === 'zodiac' && <ZodiacPage />}
        {tab === 'saju' && <SajuPage />}
      </main>
      <Footer />
    </div>
  )
}
