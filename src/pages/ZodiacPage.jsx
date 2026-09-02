import { useState } from 'react'
import { ZODIACS, dailyNumbers } from '../lib/zodiac.js'
import { NumberSet } from '../components/NumberSet.jsx'

function todayKST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function formatKoreanDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

export function ZodiacPage({ today = todayKST() }) {
  const [selected, setSelected] = useState(null)
  const zodiac = ZODIACS.find((z) => z.id === selected)

  return (
    <section className="zodiac-page">
      <p className="zodiac-date">{formatKoreanDate(today)}</p>
      <div className="zodiac-grid">
        {ZODIACS.map((z) => (
          <button
            key={z.id}
            type="button"
            className={z.id === selected ? 'zodiac-item active' : 'zodiac-item'}
            onClick={() => setSelected(z.id)}
          >
            <span className="zodiac-emoji" aria-hidden="true">{z.emoji}</span>
            <span className="zodiac-label">{z.label}</span>
          </button>
        ))}
      </div>
      {zodiac ? (
        <div className="zodiac-result surface-card">
          <h2>
            {zodiac.emoji} {zodiac.label} 오늘의 행운 번호
          </h2>
          <NumberSet numbers={dailyNumbers(zodiac.id, today)} />
          <p className="hint">같은 날에는 항상 같은 번호가 나와요. 내일 다시 확인해 보세요!</p>
        </div>
      ) : (
        <p className="status">띠를 선택하면 오늘의 행운 번호를 보여드려요</p>
      )}
    </section>
  )
}

export default ZodiacPage
