export const POOL_MIN = 1
export const POOL_MAX = 45
export const SET_SIZE = 6

function poolNumbers() {
  const arr = []
  for (let n = POOL_MIN; n <= POOL_MAX; n++) arr.push(n)
  return arr
}

function freqWeight(frequencies, n) {
  if (!frequencies) return 0
  const v = Array.isArray(frequencies) ? frequencies[n] : frequencies[n] ?? frequencies[String(n)]
  const num = Number(v)
  return Number.isFinite(num) && num > 0 ? num : 0
}

export function randomSet(rng = Math.random) {
  const pool = poolNumbers()
  // 부분 Fisher-Yates
  for (let i = pool.length - 1; i > pool.length - 1 - SET_SIZE; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = pool[i]
    pool[i] = pool[j]
    pool[j] = t
  }
  return pool.slice(pool.length - SET_SIZE).sort((a, b) => a - b)
}

export function weightedSet(frequencies, rng = Math.random) {
  let pool = poolNumbers().map((n) => ({ n, w: freqWeight(frequencies, n) }))
  const picked = []
  for (let k = 0; k < SET_SIZE; k++) {
    const total = pool.reduce((s, c) => s + c.w, 0)
    let idx
    if (total <= 0) {
      idx = Math.floor(rng() * pool.length)
    } else {
      let r = rng() * total
      idx = 0
      while (idx < pool.length - 1) {
        r -= pool[idx].w
        if (r < 0) break
        idx++
      }
    }
    picked.push(pool[idx].n)
    pool = pool.slice(0, idx).concat(pool.slice(idx + 1))
  }
  return picked.sort((a, b) => a - b)
}

export function recommendSets({ count, mode, frequencies, rng = Math.random }) {
  const make = mode === 'weighted' ? () => weightedSet(frequencies, rng) : () => randomSet(rng)
  const sets = []
  for (let i = 0; i < count; i++) sets.push(make())
  return sets
}

// 큰 원화 금액을 "30억 9,096만원" 형태로 표기
export function formatWon(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return null
  const eok = Math.floor(n / 100000000)
  const man = Math.floor((n % 100000000) / 10000)
  if (eok === 0 && man === 0) return `${n.toLocaleString('ko-KR')}원`
  const parts = []
  if (eok > 0) parts.push(`${eok}억`)
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`)
  return `${parts.join(' ')}원`
}

export function hotCold(frequencies, n) {
  const entries = poolNumbers().map((num) => ({ num, w: freqWeight(frequencies, num) }))
  const hot = [...entries].sort((a, b) => b.w - a.w || a.num - b.num).slice(0, n).map((e) => e.num)
  const cold = [...entries].sort((a, b) => a.w - b.w || a.num - b.num).slice(0, n).map((e) => e.num)
  return { hot, cold }
}
