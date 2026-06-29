// 게임명 표시 우선순위(번호 큰 게임 먼저). 목록 안정 정렬용.
const GAME_ORDER = ['스피또2000', '스피또1000', '스피또500']

export function listRounds(stores) {
  const seen = new Map()
  for (const s of stores) {
    const key = `${s.game}#${s.round}`
    if (!seen.has(key)) {
      seen.set(key, { game: s.game, round: s.round, label: `${s.game} ${s.round}회` })
    }
  }
  return [...seen.values()].sort((a, b) => {
    const g = GAME_ORDER.indexOf(a.game) - GAME_ORDER.indexOf(b.game)
    if (g !== 0) return g
    return b.round - a.round
  })
}

export function filterByRound(stores, game, round) {
  if (game === null && round === null) return stores
  return stores.filter((s) => s.game === game && s.round === round)
}

export function aggregateByRegion(stores) {
  const counts = new Map()
  for (const s of stores) {
    counts.set(s.region, (counts.get(s.region) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, 'ko'))
}

export function filterByRegion(stores, region) {
  if (region === null) return stores
  return stores.filter((s) => s.region === region)
}
