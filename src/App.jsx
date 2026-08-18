import { useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import LottoPage from './pages/LottoPage.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

const TABS = [
  { id: 'speetto', label: '스피또 당첨 지역', ready: true },
  { id: 'lotto', label: '로또 번호 추천', ready: true },
  { id: 'zodiac', label: '오늘의 띠별 번호', ready: false },
  { id: 'saju', label: '사주 번호 추천', ready: false },
]

export default function App() {
  const [tab, setTab] = useState('speetto')

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
        {tab !== 'speetto' && tab !== 'lotto' && <p className="status">준비중입니다</p>}
      </main>
      <Footer />
    </div>
  )
}
