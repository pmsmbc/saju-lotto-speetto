import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import { GAME_TABS, sellingWithRank1 } from '../lib/speetto.js'
import { SpeettoRoundCard } from '../components/SpeettoRoundCard.jsx'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function SpeettoPage() {
  const { loading, error, updatedAt, rounds } = useSpeettoData()
  const [gameCode, setGameCode] = useState(GAME_TABS[0].code)

  const list = useMemo(() => sellingWithRank1(rounds, gameCode), [rounds, gameCode])

  if (loading) return <p className="status">불러오는 중...</p>
  if (error) return <p className="status error">{error}</p>

  return (
    <section className="speetto-page">
      <p className="updated-at">마지막 업데이트: {formatDate(updatedAt)}</p>
      <nav className="game-tabs">
        {GAME_TABS.map((g) => (
          <button
            key={g.code}
            type="button"
            className={g.code === gameCode ? 'game-tab active' : 'game-tab'}
            onClick={() => setGameCode(g.code)}
          >
            {g.name}
          </button>
        ))}
      </nav>
      {list.length > 0 ? (
        <div className="speetto-rounds">
          {list.map((r) => (
            <SpeettoRoundCard
              key={r.round}
              round={r.round}
              rank1Remaining={r.rank1Remaining}
              rank1Total={r.rank1Total}
            />
          ))}
        </div>
      ) : (
        <p className="status">현재 1등이 남은 판매중 회차가 없습니다</p>
      )}
    </section>
  )
}

export default SpeettoPage
