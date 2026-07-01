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
