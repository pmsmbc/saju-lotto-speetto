import { useEffect, useRef, useState } from 'react'
import sparklesIcon from '../assets/twemoji/2728.svg'
import { useLottoStats } from '../hooks/useLottoStats.js'
import { recommendSets, hotCold, formatWon } from '../lib/lotto.js'
import { NumberSet } from '../components/NumberSet.jsx'
import { LottoBall } from '../components/LottoBall.jsx'

const SET_LABELS = ['A', 'B', 'C', 'D', 'E']
const REVEAL_DELAY_MS = 350

export function LottoPage() {
  const { loading, error, stats } = useLottoStats()
  const [sets, setSets] = useState([])
  const [revealCount, setRevealCount] = useState(0)
  const [mode, setMode] = useState('random')
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const revealNext = (total) => {
    setRevealCount((n) => {
      const next = n + 1
      if (next < total) {
        timerRef.current = setTimeout(() => revealNext(total), REVEAL_DELAY_MS)
      }
      return next
    })
  }

  const recommend = () => {
    clearTimeout(timerRef.current)
    const next = recommendSets({
      count: 5,
      mode,
      frequencies: stats ? stats.frequencies : null,
    })
    setSets(next)
    setRevealCount(0)
    timerRef.current = setTimeout(() => revealNext(next.length), REVEAL_DELAY_MS)
  }

  const generating = sets.length > 0 && revealCount < sets.length
  const hc = stats ? hotCold(stats.frequencies, 5) : null

  return (
    <section className="lotto-page">
      {stats && stats.latestDraw ? (
        <div className="latest-draw surface-card">
          <span className="draw-label">지난 회차</span>
          <h2>지난 {stats.latestRound}회 당첨번호</h2>
          <div className="latest-balls">
            <NumberSet numbers={stats.latestDraw.numbers} />
            <span className="plus">+</span>
            <LottoBall number={stats.latestDraw.bonus} />
          </div>
          {stats.latestDraw.firstPrize && formatWon(stats.latestDraw.firstPrize.amount) && (
            <p className="first-prize">
              1등 {stats.latestDraw.firstPrize.winners}명 · 1인당{' '}
              {formatWon(stats.latestDraw.firstPrize.amount)}
            </p>
          )}
        </div>
      ) : null}

      <div className="mode-segment">
        <button
          type="button"
          className={mode === 'weighted' ? 'mode-option active' : 'mode-option'}
          onClick={() => setMode('weighted')}
          disabled={!stats || generating}
        >
          통계 기반
        </button>
        <button
          type="button"
          className={mode === 'random' ? 'mode-option active' : 'mode-option'}
          onClick={() => setMode('random')}
          disabled={generating}
        >
          랜덤
        </button>
      </div>
      <button type="button" className="recommend-cta" onClick={recommend} disabled={generating}>
        {generating ? (
          `번호 생성 중... (${revealCount}/${sets.length})`
        ) : (
          <>
            <img className="btn-icon" src={sparklesIcon} alt="" aria-hidden="true" /> 5세트 추천받기
          </>
        )}
      </button>
      {loading ? <p className="status">통계 불러오는 중...</p> : null}
      {error ? <p className="hint">{error} (랜덤 추천은 사용할 수 있어요)</p> : null}

      {sets.length > 0 ? (
        <div className="lotto-sets">
          {sets.slice(0, revealCount).map((s, i) => (
            <NumberSet key={i} label={SET_LABELS[i]} numbers={s} />
          ))}
          {generating && (
            <div className="number-set set-generating">
              <span className="set-label">{SET_LABELS[revealCount]}</span>
              <span className="set-spinner" aria-hidden="true" />
              <span className="generating-text">생성 중...</span>
            </div>
          )}
        </div>
      ) : null}

      {hc ? (
        <div className="hotcold">
          <div>
            <h3>자주 나온 번호</h3>
            <div className="set-balls">
              {hc.hot.map((n) => (
                <LottoBall key={n} number={n} />
              ))}
            </div>
          </div>
          <div>
            <h3>안 나온 번호</h3>
            <div className="set-balls">
              {hc.cold.map((n) => (
                <LottoBall key={n} number={n} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default LottoPage
