import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import { GAME_TABS, sellingWithRank1 } from '../lib/speetto.js'
import {
  listRounds,
  filterByRound,
  aggregateByRegion,
  filterByRegion,
} from '../lib/aggregate.js'
import { SpeettoRoundCard } from '../components/SpeettoRoundCard.jsx'
import { RegionStats } from '../components/RegionStats.jsx'
import { StoreList } from '../components/StoreList.jsx'
import { RoundSelector } from '../components/RoundSelector.jsx'

const MODES = [
  { id: 'region', label: '당첨 지역' },
  { id: 'remaining', label: '1등 잔여' },
]

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function SpeettoPage() {
  const { loading, error, updatedAt, rounds, stores } = useSpeettoData()
  const [gameCode, setGameCode] = useState(GAME_TABS[0].code)
  const [mode, setMode] = useState('region')
  const [roundKey, setRoundKey] = useState('')
  const [selectedRegion, setSelectedRegion] = useState(null)

  const gameName = useMemo(
    () => GAME_TABS.find((g) => g.code === gameCode)?.name,
    [gameCode],
  )

  // 선택 게임의 당첨 판매점
  const gameStores = useMemo(
    () => stores.filter((s) => s.game === gameName),
    [stores, gameName],
  )
  const roundOptions = useMemo(() => listRounds(gameStores), [gameStores])

  const byRound = useMemo(() => {
    if (!roundKey) return gameStores
    const [g, r] = roundKey.split('#')
    return filterByRound(gameStores, g, Number(r))
  }, [gameStores, roundKey])

  const regionStats = useMemo(() => aggregateByRegion(byRound), [byRound])
  const visibleStores = useMemo(
    () => filterByRegion(byRound, selectedRegion),
    [byRound, selectedRegion],
  )

  const remainingList = useMemo(
    () => sellingWithRank1(rounds, gameCode),
    [rounds, gameCode],
  )

  function changeGame(code) {
    setGameCode(code)
    setRoundKey('')
    setSelectedRegion(null)
  }

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
            onClick={() => changeGame(g.code)}
          >
            {g.name}
          </button>
        ))}
      </nav>
      <nav className="mode-tabs">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={m.id === mode ? 'mode-tab active' : 'mode-tab'}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {mode === 'region' ? (
        <div className="speetto-region">
          <RoundSelector
            rounds={roundOptions}
            value={roundKey}
            onChange={(v) => {
              setRoundKey(v)
              setSelectedRegion(null)
            }}
          />
          <RegionStats
            stats={regionStats}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />
          <StoreList stores={visibleStores} />
        </div>
      ) : remainingList.length > 0 ? (
        <div className="speetto-rounds">
          {remainingList.map((r) => (
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
