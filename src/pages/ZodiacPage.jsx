import { ZODIACS, dailyLuckyPair } from '../lib/zodiac.js'
import ratIcon from '../assets/twemoji/1f42d.svg'
import oxIcon from '../assets/twemoji/1f42e.svg'
import tigerIcon from '../assets/twemoji/1f42f.svg'
import rabbitIcon from '../assets/twemoji/1f430.svg'
import dragonIcon from '../assets/twemoji/1f432.svg'
import snakeIcon from '../assets/twemoji/1f40d.svg'
import horseIcon from '../assets/twemoji/1f434.svg'
import sheepIcon from '../assets/twemoji/1f411.svg'
import monkeyIcon from '../assets/twemoji/1f435.svg'
import roosterIcon from '../assets/twemoji/1f414.svg'
import dogIcon from '../assets/twemoji/1f436.svg'
import pigIcon from '../assets/twemoji/1f437.svg'

const ZODIAC_ICONS = {
  rat: ratIcon, ox: oxIcon, tiger: tigerIcon, rabbit: rabbitIcon,
  dragon: dragonIcon, snake: snakeIcon, horse: horseIcon, sheep: sheepIcon,
  monkey: monkeyIcon, rooster: roosterIcon, dog: dogIcon, pig: pigIcon,
}
import { lunarDateKorean } from '../lib/lunar.js'
import { todayKST, formatKoreanDate, weekdayInfo } from '../lib/dateformat.js'
import { LottoBall } from '../components/LottoBall.jsx'


export function ZodiacPage({ today = todayKST() }) {
  return (
    <section className="zodiac-page">
      <p className="zodiac-date">
        {formatKoreanDate(today)}{' '}
        <span className={weekdayInfo(today).cls}>{weekdayInfo(today).name}</span>
        <span className="zodiac-lunar"> ({lunarDateKorean(today)})</span>
      </p>
      <div className="zodiac-grid">
        {ZODIACS.map((z) => (
          <div key={z.id} className="zodiac-item">
            <img className="zodiac-emoji" src={ZODIAC_ICONS[z.id]} alt="" aria-hidden="true" />
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
