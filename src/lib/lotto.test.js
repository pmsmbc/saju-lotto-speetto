import { describe, test, expect } from 'vitest'
import {
  randomSet, weightedSet, recommendSets, hotCold,
  POOL_MIN, POOL_MAX, SET_SIZE,
} from './lotto.js'

// 결정적 RNG: 주어진 값들을 순환 반환
function seqRng(values) {
  let i = 0
  return () => values[i++ % values.length]
}

function isValidSet(s) {
  return (
    Array.isArray(s) &&
    s.length === SET_SIZE &&
    new Set(s).size === SET_SIZE &&
    s.every((n) => Number.isInteger(n) && n >= POOL_MIN && n <= POOL_MAX) &&
    s.every((n, i) => i === 0 || s[i - 1] < n)
  )
}

describe('randomSet', () => {
  test('항상 1~45 범위의 서로 다른 6개를 오름차순으로 반환', () => {
    const rng = seqRng([0.01, 0.5, 0.99, 0.2, 0.7, 0.4, 0.3, 0.9, 0.1, 0.6])
    const s = randomSet(rng)
    expect(isValidSet(s)).toBe(true)
  })
  test('같은 rng 시퀀스는 같은 결과(결정적)', () => {
    const a = randomSet(seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]))
    const b = randomSet(seqRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]))
    expect(a).toEqual(b)
  })
})

describe('weightedSet', () => {
  test('가중치가 0인 번호는 뽑지 않는다 (6개만 양수면 그 6개)', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = 0
    for (const n of [1, 2, 3, 4, 5, 6]) freq[n] = 100
    const s = weightedSet(freq, seqRng([0.05, 0.05, 0.05, 0.05, 0.05, 0.05]))
    expect(s).toEqual([1, 2, 3, 4, 5, 6])
  })
  test('모든 가중치 0이면 균등 폴백으로도 유효한 세트', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = 0
    const s = weightedSet(freq, seqRng([0.01, 0.5, 0.99, 0.2, 0.7, 0.4]))
    expect(isValidSet(s)).toBe(true)
  })
})

describe('recommendSets', () => {
  test('count개의 유효한 세트를 만든다 (random)', () => {
    const sets = recommendSets({ count: 5, mode: 'random', rng: Math.random })
    expect(sets).toHaveLength(5)
    expect(sets.every(isValidSet)).toBe(true)
  })
  test('weighted 모드는 frequencies를 사용', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = n // 큰 번호일수록 가중치 큼
    const sets = recommendSets({ count: 3, mode: 'weighted', frequencies: freq, rng: Math.random })
    expect(sets).toHaveLength(3)
    expect(sets.every(isValidSet)).toBe(true)
  })
})

describe('hotCold', () => {
  test('빈도 상위/하위 n개', () => {
    const freq = {}
    for (let n = 1; n <= 45; n++) freq[n] = 0
    freq[10] = 50; freq[20] = 40; freq[30] = 30 // 핫
    freq[1] = 1; freq[2] = 2; freq[3] = 3       // 콜드(낮은 양수) — 0인 번호가 더 많아 하위는 0짜리들
    const { hot, cold } = hotCold(freq, 3)
    expect(hot).toEqual([10, 20, 30])
    // 0인 번호가 다수 → 하위 3개는 가장 작은 번호의 0짜리들
    expect(cold).toEqual([4, 5, 6])
  })
})
