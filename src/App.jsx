import { useState } from 'react'
import SpeettoPage from './pages/SpeettoPage.jsx'
import LottoPage from './pages/LottoPage.jsx'
import './App.css'

const TABS = [
  { id: 'speetto', label: '스피또 당첨 지역' },
  { id: 'lotto', label: '로또 번호 추천' },
  { id: 'zodiac', label: '오늘의 띠별 번호' },
  { id: 'saju', label: '사주 번호 추천' },
]

export default function App() {
  const [tab, setTab] = useState('speetto')
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">사주·로또·스피또</h1>
        <nav className="app-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {tab === 'speetto' && <SpeettoPage />}
        {tab === 'lotto' && <LottoPage />}
        {tab !== 'speetto' && tab !== 'lotto' && <p className="status">준비중입니다</p>}
      </main>
    </div>
  )
}
