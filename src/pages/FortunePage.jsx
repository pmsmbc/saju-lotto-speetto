import { useEffect, useRef, useState } from 'react'
import { ZODIACS, dailyLuckyPair } from '../lib/zodiac.js'
import { allFortunes, todayIljin } from '../lib/fortune.js'
import { lunarDateKorean } from '../lib/lunar.js'
import { todayKST, formatKoreanDate, weekdayInfo } from '../lib/dateformat.js'
import { LottoBall } from '../components/LottoBall.jsx'
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

const GRADE_CLASS = { 대길: 'g-best', 길: 'g-good', 보통: 'g-normal', 주의: 'g-care' }

export function FortunePage({ today = todayKST() }) {
  const [selected, setSelected] = useState(null)
  const detailRef = useRef(null)

  // 띠 선택 시 상세 카드로 부드럽게 스크롤
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [selected])
  const fortunes = allFortunes(today)
  const iljin = todayIljin(today)
  const current = fortunes.find((f) => f.zodiac.id === selected)

  return (
    <section className="fortune-page">
      <p className="zodiac-date">
        {formatKoreanDate(today)}{' '}
        <span className={weekdayInfo(today).cls}>{weekdayInfo(today).name}</span>
        <span className="zodiac-lunar"> ({lunarDateKorean(today)})</span>
      </p>
      <p className="fortune-iljin">
        오늘의 일진: <strong>{iljin.name}({iljin.hanja})일</strong>
      </p>
      <div className="zodiac-grid">
        {fortunes.map((f) => (
          <button
            key={f.zodiac.id}
            type="button"
            className={f.zodiac.id === selected ? 'zodiac-item fortune-item active' : 'zodiac-item fortune-item'}
            onClick={() => setSelected(f.zodiac.id === selected ? null : f.zodiac.id)}
          >
            <img className="zodiac-emoji" src={ZODIAC_ICONS[f.zodiac.id]} alt="" aria-hidden="true" />
            <span className="zodiac-label">{f.zodiac.label}</span>
            <span className={`grade-badge ${GRADE_CLASS[f.grade]}`}>{f.grade}</span>
          </button>
        ))}
      </div>
      {current ? (
        <div className="fortune-detail surface-card" ref={detailRef}>
          <h2>
            {current.zodiac.label} 오늘의 운세{' '}
            <span className={`grade-badge ${GRADE_CLASS[current.grade]}`}>{current.grade}</span>
          </h2>
          <p className="fortune-keywords">
            재물: <strong>{current.keywords.money}</strong> · 건강:{' '}
            <strong>{current.keywords.health}</strong> · 사랑:{' '}
            <strong>{current.keywords.love}</strong> · 길방:{' '}
            <strong>{current.direction}</strong>
          </p>
          <ul className="fortune-years">
            {current.yearLines.map((l) => (
              <li key={l.year}>
                <strong>{l.label}</strong> {l.text}
              </li>
            ))}
          </ul>
          <div className="fortune-lucky">
            <span>오늘의 행운 번호</span>
            {dailyLuckyPair(current.zodiac.id, today).map((n) => (
              <LottoBall key={n} number={n} />
            ))}
          </div>
        </div>
      ) : (
        <p className="status">띠를 선택하면 오늘의 운세를 보여드려요</p>
      )}
      <p className="hint zodiac-hint">일진과 띠의 관계(합·충)로 보는 운세입니다.</p>
    </section>
  )
}

export default FortunePage
