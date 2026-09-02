import { randomSet } from './lotto.js'

export const ZODIACS = [
  { id: 'rat', label: '쥐띠', emoji: '🐭', rem: 4 },
  { id: 'ox', label: '소띠', emoji: '🐮', rem: 5 },
  { id: 'tiger', label: '호랑이띠', emoji: '🐯', rem: 6 },
  { id: 'rabbit', label: '토끼띠', emoji: '🐰', rem: 7 },
  { id: 'dragon', label: '용띠', emoji: '🐲', rem: 8 },
  { id: 'snake', label: '뱀띠', emoji: '🐍', rem: 9 },
  { id: 'horse', label: '말띠', emoji: '🐴', rem: 10 },
  { id: 'sheep', label: '양띠', emoji: '🐑', rem: 11 },
  { id: 'monkey', label: '원숭이띠', emoji: '🐵', rem: 0 },
  { id: 'rooster', label: '닭띠', emoji: '🐔', rem: 1 },
  { id: 'dog', label: '개띠', emoji: '🐶', rem: 2 },
  { id: 'pig', label: '돼지띠', emoji: '🐷', rem: 3 },
]

export function zodiacForYear(year) {
  return ZODIACS.find((z) => z.rem === ((year % 12) + 12) % 12)
}

export function recentYears(zodiac, count = 3, currentYear = new Date().getFullYear()) {
  let y = currentYear
  while ((((y % 12) + 12) % 12) !== zodiac.rem) y--
  const years = []
  for (let i = 0; i < count; i++) years.push(y - i * 12)
  return years
}

// 문자열 → 32비트 시드 (FNV-1a)
function hashSeed(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// 시드 기반 결정적 난수 (mulberry32)
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dailyNumbers(zodiacId, dateStr) {
  return randomSet(mulberry32(hashSeed(`${dateStr}:${zodiacId}`)))
}
