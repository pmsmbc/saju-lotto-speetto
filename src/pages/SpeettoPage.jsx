import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import {
  listRounds,
  filterByRound,
  aggregateByRegion,
  filterByRegion,
} from '../lib/aggregate.js'
import { RoundSelector } from '../components/RoundSelector.jsx'
import { RegionStats } from '../components/RegionStats.jsx'
import { StoreList } from '../components/StoreList.jsx'

function parseRoundValue(value) {
  if (!value) return { game: null, round: null }
  const [game, round] = value.split('#')
  return { game, round: Number(round) }
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function SpeettoPage() {
  const { loading, error, updatedAt, stores } = useSpeettoData()
  const [roundValue, setRoundValue] = useState('')
  const [selectedRegion, setSelectedRegion] = useState(null)

  const rounds = useMemo(() => listRounds(stores), [stores])
  const { game, round } = parseRoundValue(roundValue)
  const roundStores = useMemo(
    () => filterByRound(stores, game, round),
    [stores, game, round],
  )
  const stats = useMemo(() => aggregateByRegion(roundStores), [roundStores])
  const visibleStores = useMemo(
    () => filterByRegion(roundStores, selectedRegion),
    [roundStores, selectedRegion],
  )

  if (loading) return <p className="status">불러오는 중...</p>
  if (error) return <p className="status error">{error}</p>

  return (
    <section className="speetto-page">
      <p className="updated-at">마지막 업데이트: {formatDate(updatedAt)}</p>
      <RoundSelector
        rounds={rounds}
        value={roundValue}
        onChange={(v) => {
          setRoundValue(v)
          setSelectedRegion(null)
        }}
      />
      <h2>지역별 당첨</h2>
      <RegionStats
        stats={stats}
        selectedRegion={selectedRegion}
        onSelectRegion={setSelectedRegion}
      />
      <h2>당첨 판매점</h2>
      <StoreList stores={visibleStores} />
    </section>
  )
}

export default SpeettoPage
