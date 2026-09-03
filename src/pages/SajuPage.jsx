import { useEffect, useState } from 'react'
import { HOUR_OPTIONS, fourPillars, sajuNumbers } from '../lib/saju.js'
import { LottoBall } from '../components/LottoBall.jsx'
import { lunarToSolar } from '../lib/lunar.js'

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
  const [cal, setCal] = useState(saved.cal ?? 'solar')

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ birth, hour, cal }))
    } catch {
      // 저장 실패는 무시
    }
  }, [birth, hour, cal])

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birth)
  // 음력 입력이면 양력으로 변환해 계산
  const solarBirth = !valid ? null : cal === 'lunar'
    ? lunarToSolar(...birth.split('-').map(Number))
    : birth
  const pillars = solarBirth ? fourPillars(solarBirth, hour === '' ? null : Number(hour)) : null

  return (
    <section className="saju-page">
      <div className="saju-form surface-card">
        <div className="person-head">
          <strong>사주 정보</strong>
          <div className="cal-toggle" role="group" aria-label="달력 구분">
            {[['solar', '양력'], ['lunar', '음력']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={cal === id ? 'cal-btn active' : 'cal-btn'}
                onClick={() => setCal(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
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
        {cal === 'lunar' && valid && (
          <p className={solarBirth ? 'cal-note' : 'cal-note error'}>
            {solarBirth ? `양력 ${solarBirth}으로 계산합니다` : '음력 날짜를 확인해 주세요 (윤달은 지원하지 않아요)'}
          </p>
        )}
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
              {sajuNumbers(solarBirth, hour === '' ? null : Number(hour), today).map((n) => (
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
