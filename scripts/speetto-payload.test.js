import { describe, it, expect } from 'vitest'
import { buildPayload } from './speetto-payload.js'

const GAME_NAMES = ['스피또500', '스피또1000', '스피또2000']

const completeRounds = [
  { gameCode: 'SP500', game: '스피또500', round: 70, rank1Total: 3, rank1Remaining: 1 },
  { gameCode: 'SP1000', game: '스피또1000', round: 80, rank1Total: 4, rank1Remaining: 2 },
  { gameCode: 'SP2000', game: '스피또2000', round: 60, rank1Total: 5, rank1Remaining: 3 },
]

const completeStores = GAME_NAMES.map((game, i) => ({
  game,
  round: 10 + i,
  rank: 1,
  store: `판매점${i}`,
  region: '서울',
}))

const NOW = '2026-08-20T00:00:00.000Z'

describe('buildPayload', () => {
  it('전부 성공하면 새 rounds/stores와 updatedAt으로 payload를 만든다', () => {
    const result = buildPayload({
      rounds: completeRounds,
      stores: completeStores,
      previous: null,
      gameNames: GAME_NAMES,
      now: NOW,
    })
    expect(result.payload).toEqual({ updatedAt: NOW, rounds: completeRounds, stores: completeStores })
    expect(result.storesFellBack).toBe(false)
  })

  it('잔여 현황이 불완전하면 null을 반환한다', () => {
    const result = buildPayload({
      rounds: [],
      stores: completeStores,
      previous: null,
      gameNames: GAME_NAMES,
      now: NOW,
    })
    expect(result).toBeNull()
  })

  it('판매점 스크래핑이 불완전하면 기존 stores를 유지하고 rounds/updatedAt만 갱신한다', () => {
    const previous = {
      updatedAt: '2026-08-18T08:35:35.497Z',
      rounds: [{ gameCode: 'SP500', game: '스피또500', round: 69, rank1Total: 3, rank1Remaining: 2 }],
      stores: completeStores,
    }
    const incompleteStores = completeStores.slice(0, 1) // 스피또1000/2000 누락
    const result = buildPayload({
      rounds: completeRounds,
      stores: incompleteStores,
      previous,
      gameNames: GAME_NAMES,
      now: NOW,
    })
    expect(result.payload).toEqual({ updatedAt: NOW, rounds: completeRounds, stores: completeStores })
    expect(result.storesFellBack).toBe(true)
  })

  it('판매점 스크래핑이 불완전하고 기존 데이터도 없으면 빈 stores로 갱신한다', () => {
    const result = buildPayload({
      rounds: completeRounds,
      stores: [],
      previous: null,
      gameNames: GAME_NAMES,
      now: NOW,
    })
    expect(result.payload).toEqual({ updatedAt: NOW, rounds: completeRounds, stores: [] })
    expect(result.storesFellBack).toBe(true)
  })
})
