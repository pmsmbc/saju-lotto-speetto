import { useMemo, useState } from 'react'
import { useSpeettoData } from '../hooks/useSpeettoData.js'
import { GAME_TABS, sellingWithRank1, recentFinished } from '../lib/speetto.js'
import { aggregateByArea, filterByArea } from '../lib/aggregate.js'
import { RegionStats } from '../components/RegionStats.jsx'
import { StoreList } from '../components/StoreList.jsx'

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  // 한국 시간(KST) 기준 YYYY-MM-DD HH:mm
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t) => parts.find((p) => p.type === t)?.value ?? ''
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}`
}

// 한 회차의 1등 당첨 지역 + 판매점 (지역 클릭 시 판매점 목록 필터)
// 아코디언: expanded가 true일 때만 지역 필터 + 판매점 목록을 펼쳐 보여줌
function RoundRegion({ round, rank1Remaining, rank1Total, stockRate, rank1Stores, expanded, onToggle, ended }) {
  const [region, setRegion] = useState(null)
  const stats = useMemo(() => aggregateByArea(rank1Stores), [rank1Stores])
  const visible = useMemo(
    () => filterByArea(rank1Stores, region),
    [rank1Stores, region],
  )

  return (
    <div className="round-region">
      <button type="button" className="round-head" onClick={onToggle}>
        <span className="round-no">{round}회</span>
        <span className="round-meta">
          {ended ? (
            <span className="ended-badge">판매종료</span>
          ) : (
            <>
              {Number.isFinite(stockRate) && (
                <span className="stock-rate">입고율 {stockRate}%</span>
              )}
              <span className="rank1-remain">
                1등 남음 {rank1Remaining}매/{rank1Total}매
              </span>
            </>
          )}
          <span className={expanded ? 'chevron expanded' : 'chevron'} aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </button>
      {expanded && (
        <div className="round-body">
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
      )}
    </div>
  )
}

export function SpeettoPage() {
  const { loading, error, updatedAt, rounds, stores } = useSpeettoData()
  const [gameCode, setGameCode] = useState(GAME_TABS[0].code)
  // 아코디언: 펼쳐진 회차. undefined면 최신 회차를 기본으로 펼침, null이면 전부 접힘
  const [expandedRound, setExpandedRound] = useState(undefined)
  // 종료 회차 아코디언: 기본은 전부 접힘(null)
  const [expandedFinished, setExpandedFinished] = useState(null)

  const handleGameChange = (code) => {
    setGameCode(code)
    setExpandedRound(undefined)
    setExpandedFinished(null)
  }

  const gameName = useMemo(
    () => GAME_TABS.find((g) => g.code === gameCode)?.name,
    [gameCode],
  )

  // 선택 게임의 판매중 & 1등 남은 회차(최신순)
  const remainingRounds = useMemo(
    () => sellingWithRank1(rounds, gameCode),
    [rounds, gameCode],
  )

  // 최근 판매종료된 회차(최신순, 최대 2개) - 종료 후에도 당첨 지역 확인용
  const finishedRounds = useMemo(
    () => recentFinished(rounds, gameCode, 2),
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
            onClick={() => handleGameChange(g.code)}
          >
            {g.name}
          </button>
        ))}
      </nav>

      {remainingRounds.length > 0 ? (
        <div className="speetto-rounds">
          {remainingRounds.map((r, i) => {
            const isExpanded =
              expandedRound === undefined ? i === 0 : expandedRound === r.round
            return (
              <RoundRegion
                key={r.round}
                round={r.round}
                rank1Remaining={r.rank1Remaining}
                rank1Total={r.rank1Total}
                stockRate={r.stockRate}
                rank1Stores={rank1ByRound.get(r.round) ?? []}
                expanded={isExpanded}
                onToggle={() => setExpandedRound(isExpanded ? null : r.round)}
              />
            )
          })}
        </div>
      ) : (
        <p className="status">현재 1등이 남은 판매중 회차가 없습니다</p>
      )}

      {finishedRounds.length > 0 && (
        <>
          <h2 className="section-title">최근 종료 회차 당첨 지역</h2>
          <div className="speetto-rounds">
            {finishedRounds.map((r) => {
              const isExpanded = expandedFinished === r.round
              return (
                <RoundRegion
                  key={r.round}
                  round={r.round}
                  rank1Stores={rank1ByRound.get(r.round) ?? []}
                  expanded={isExpanded}
                  onToggle={() => setExpandedFinished(isExpanded ? null : r.round)}
                  ended
                />
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default SpeettoPage
