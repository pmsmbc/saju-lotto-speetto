import { ZODIACS, dailyLuckyPair } from '../lib/zodiac.js'
import { lunarDateKorean } from '../lib/lunar.js'
import { LottoBall } from '../components/LottoBall.jsx'

function todayKST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

function formatKoreanDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

export function ZodiacPage({ today = todayKST() }) {
  return (
    <section className="zodiac-page">
      <p className="zodiac-date">
        {formatKoreanDate(today)}
        <span className="zodiac-lunar"> ({lunarDateKorean(today)})</span>
      </p>
      <div className="zodiac-grid">
        {ZODIACS.map((z) => (
          <div key={z.id} className="zodiac-item">
            <span className="zodiac-emoji" aria-hidden="true">{z.emoji}</span>
            <span className="zodiac-label">{z.label}</span>
            <span className="zodiac-nums">
              {dailyLuckyPair(z.id, today).map((n) => (
                <LottoBall key={n} number={n} />
              ))}
            </span>
          </div>
        ))}
      </div>
      <p className="hint zodiac-hint">같은 날에는 항상 같은 번호가 나와요. 내일 다시 확인해 보세요!</p>
    </section>
  )
}

export default ZodiacPage
