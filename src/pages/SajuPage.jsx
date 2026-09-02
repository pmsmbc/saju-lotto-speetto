import { useEffect, useState } from 'react'
import { HOUR_OPTIONS, fourPillars, sajuNumbers } from '../lib/saju.js'
import { LottoBall } from '../components/LottoBall.jsx'

function todayKST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

const STORE_KEY = 'satto.saju'

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {}
  } catch {
    return {}
  }
}

const PILLAR_LABELS = { year: '년주', month: '월주', day: '일주', hour: '시주' }

function PillarCard({ label, p }) {
  return (
    <div className="pillar-card">
      <span className="pillar-hanja">{p ? p.hanja : '─'}</span>
      <span className="pillar-name">{p ? p.name : '모름'}</span>
      <span className="pillar-label">{label}</span>
    </div>
  )
}

export function SajuPage({ today = todayKST() }) {
  const saved = loadSaved()
  const [birth, setBirth] = useState(saved.birth ?? '')
  const [hour, setHour] = useState(saved.hour ?? '')

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ birth, hour }))
    } catch {
      // 저장 실패는 무시
    }
  }, [birth, hour])

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birth)
  const pillars = valid ? fourPillars(birth, hour === '' ? null : Number(hour)) : null

  return (
    <section className="saju-page">
      <div className="saju-form surface-card">
        <label className="saju-field">
          <span>생년월일</span>
          <input
            type="date"
            value={birth}
            min="1930-01-01"
            max={today}
            onChange={(e) => setBirth(e.target.value)}
          />
        </label>
        <label className="saju-field">
          <span>태어난 시</span>
          <select value={hour} onChange={(e) => setHour(e.target.value)}>
            <option value="">모름</option>
            {HOUR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {pillars ? (
        <>
          <div className="saju-pillars">
            {['year', 'month', 'day', 'hour'].map((k) => (
              <PillarCard key={k} label={PILLAR_LABELS[k]} p={pillars[k]} />
            ))}
          </div>
          <div className="saju-result surface-card">
            <h2>오늘의 사주 행운 번호</h2>
            <div className="set-balls">
              {sajuNumbers(birth, hour === '' ? null : Number(hour), today).map((n) => (
                <LottoBall key={n} number={n} />
              ))}
            </div>
            <p className="hint">사주와 오늘 날짜로 뽑는 번호예요. 내일 다시 확인해 보세요!</p>
          </div>
        </>
      ) : (
        <p className="status">생년월일을 입력하면 사주와 행운 번호를 보여드려요</p>
      )}
    </section>
  )
}

export default SajuPage
