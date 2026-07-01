import { describe, test, expect } from 'vitest'
import { GAME_TABS, sellingWithRank1 } from './speetto.js'

const rounds = [
  { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
  { game: '스피또2000', gameCode: 'SP2000', round: 67, status: '판매중', rank1Remaining: 0, rank1Total: 6 },
  { game: '스피또2000', gameCode: 'SP2000', round: 66, status: '판매종료', rank1Remaining: 3, rank1Total: 6 },
  { game: '스피또1000', gameCode: 'SP1000', round: 106, status: '판매중', rank1Remaining: 2, rank1Total: 12 },
  { game: '스피또1000', gameCode: 'SP1000', round: 107, status: '판매중', rank1Remaining: 9, rank1Total: 12 },
]

test('GAME_TABS는 3개 게임(2000/1000/500 순)', () => {
  expect(GAME_TABS.map((g) => g.code)).toEqual(['SP2000', 'SP1000', 'SP500'])
})

test('판매중 & 1등 잔여>0 만 (판매종료·잔여0 제외)', () => {
  expect(sellingWithRank1(rounds, 'SP2000')).toEqual([
    { game: '스피또2000', gameCode: 'SP2000', round: 68, status: '판매중', rank1Remaining: 7, rank1Total: 8 },
  ])
})

test('회차 내림차순', () => {
  expect(sellingWithRank1(rounds, 'SP1000').map((r) => r.round)).toEqual([107, 106])
})

test('해당 게임 없으면 빈 배열', () => {
  expect(sellingWithRank1(rounds, 'SP500')).toEqual([])
})
