import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import { GAME_TABS, sellingWithRank1 } from '../lib/speetto.js'
import { aggregateByRegion, filterByRegion } from '../lib/aggregate.js'
import { RegionStats } from '../components/RegionStats.jsx'
import { StoreList } from '../components/StoreList.jsx'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

// 한 회차의 1등 당첨 지역 + 판매점 (지역 클릭 시 판매점 목록 필터)
function RoundRegion({ round, rank1Remaining, rank1Total, rank1Stores }) {
  const [region, setRegion] = useState(null)
  const stats = useMemo(() => aggregateByRegion(rank1Stores), [rank1Stores])
  const visible = useMemo(
    () => filterByRegion(rank1Stores, region),
    [rank1Stores, region],
  )

  return (
    <div className="round-region">
      <div className="round-head">
        <span className="round-no">{round}회</span>
        <span className="rank1-remain">
          1등 남음 {rank1Remaining}매/{rank1Total}매
        </span>
      </div>
      {rank1Stores.length === 0 ? (
        <p className="empty">아직 1등 당첨 지역이 없습니다</p>
      ) : (
        <>
          <RegionStats
            stats={stats}
            selectedRegion={region}
            onSelectRegion={setRegion}
          />
          <StoreList stores={visible} />
        </>
      )}
    </div>
  )
}

export function SpeettoPage() {
  const { loading, error, updatedAt, rounds, stores } = useSpeettoData()
  const [gameCode, setGameCode] = useState(GAME_TABS[0].code)

  const gameName = useMemo(
    () => GAME_TABS.find((g) => g.code === gameCode)?.name,
    [gameCode],
  )

  // 선택 게임의 판매중 & 1등 남은 회차(최신순)
  const remainingRounds = useMemo(
    () => sellingWithRank1(rounds, gameCode),
    [rounds, gameCode],
  )

  // 회차별 1등 당첨 판매점
  const rank1ByRound = useMemo(() => {
    const map = new Map()
    for (const s of stores) {
      if (s.game === gameName && s.rank === 1) {
        const list = map.get(s.round) ?? []
        list.push(s)
        map.set(s.round, list)
      }
    }
    return map
  }, [stores, gameName])

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

      {remainingRounds.length > 0 ? (
        <div className="speetto-rounds">
          {remainingRounds.map((r) => (
            <RoundRegion
              key={r.round}
              round={r.round}
              rank1Remaining={r.rank1Remaining}
              rank1Total={r.rank1Total}
              rank1Stores={rank1ByRound.get(r.round) ?? []}
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
