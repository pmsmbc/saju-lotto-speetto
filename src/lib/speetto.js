export const GAME_TABS = [
  { code: 'SP2000', name: '스피또2000' },
  { code: 'SP1000', name: '스피또1000' },
  { code: 'SP500', name: '스피또500' },
]

export function sellingWithRank1(rounds, gameCode) {
  return (rounds ?? [])
    .filter(
      (r) => r.gameCode === gameCode && r.status === '판매중' && r.rank1Remaining > 0,
    )
    .sort((a, b) => b.round - a.round)
}

// 최근 판매종료된 회차(최신순, 최대 limit개) - 종료 후에도 1등 당첨 지역을 보여주기 위함
export function recentFinished(rounds, gameCode, limit = 2) {
  return (rounds ?? [])
    .filter((r) => r.gameCode === gameCode && r.status === '판매종료')
    .sort((a, b) => b.round - a.round)
    .slice(0, limit)
}
