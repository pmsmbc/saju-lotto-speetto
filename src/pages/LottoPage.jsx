import { useState } from 'react'
import { useLottoStats } from '../hooks/useLottoStats.js'
import { recommendSets, hotCold } from '../lib/lotto.js'
import { NumberSet } from '../components/NumberSet.jsx'
import { LottoBall } from '../components/LottoBall.jsx'

const SET_LABELS = ['A', 'B', 'C', 'D', 'E']

export function LottoPage() {
  const { loading, error, stats } = useLottoStats()
  const [sets, setSets] = useState([])

  const recommend = (mode) => {
    setSets(
      recommendSets({
        count: 5,
        mode,
        frequencies: stats ? stats.frequencies : null,
      }),
    )
  }

  const hc = stats ? hotCold(stats.frequencies, 5) : null

  return (
    <section className="lotto-page">
      {stats && stats.latestDraw ? (
        <div className="latest-draw">
          <h2>지난 {stats.latestRound}회 당첨번호</h2>
          <div className="latest-balls">
            <NumberSet numbers={stats.latestDraw.numbers} />
            <span className="plus">+</span>
            <LottoBall number={stats.latestDraw.bonus} />
          </div>
        </div>
      ) : null}

      <div className="lotto-actions">
        <button type="button" onClick={() => recommend('random')}>
          랜덤 추천 5세트
        </button>
        <button type="button" onClick={() => recommend('weighted')} disabled={!stats}>
          통계 기반 추천 5세트
        </button>
      </div>
      {loading ? <p className="status">통계 불러오는 중...</p> : null}
      {error ? <p className="hint">{error} (랜덤 추천은 사용할 수 있어요)</p> : null}

      {sets.length > 0 ? (
        <div className="lotto-sets">
          {sets.map((s, i) => (
            <NumberSet key={i} label={SET_LABELS[i]} numbers={s} />
          ))}
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
