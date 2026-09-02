import { hashSeed, mulberry32 } from './seed.js'
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


export function dailyLuckyPair(zodiacId, dateStr) {
  const rng = mulberry32(hashSeed(`${dateStr}:${zodiacId}`))
  const a = 1 + Math.floor(rng() * 45)
  let b = a
  while (b === a) b = 1 + Math.floor(rng() * 45)
  return [a, b].sort((x, y) => x - y)
}
