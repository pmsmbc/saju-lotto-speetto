function formatYmd(ymd) {
  const s = String(ymd)
  if (s.length !== 8) return s
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

export function parseDraw(item) {
  const numbers = [item.tm1WnNo, item.tm2WnNo, item.tm3WnNo, item.tm4WnNo, item.tm5WnNo, item.tm6WnNo]
    .map(Number)
    .sort((a, b) => a - b)
  return {
    round: Number(item.ltEpsd),
    numbers,
    bonus: Number(item.bnsWnNo),
    date: formatYmd(item.ltRflYmd),
  }
}

export function computeFrequencies(draws) {
  const freq = {}
  for (let n = 1; n <= 45; n++) freq[n] = 0
  for (const d of draws) {
    for (const n of d.numbers) {
      if (n >= 1 && n <= 45) freq[n] += 1
    }
  }
  return freq
}

export function buildStats(draws) {
  const sorted = [...draws].sort((a, b) => b.round - a.round)
  const latest = sorted[0] ?? null
  return {
    latestRound: latest ? latest.round : 0,
    latestDraw: latest
      ? { round: latest.round, numbers: latest.numbers, bonus: latest.bonus, date: latest.date }
      : null,
    totalDraws: draws.length,
    frequencies: computeFrequencies(draws),
  }
}

export function isCompleteLottoStats(stats) {
  if (!stats || stats.totalDraws <= 0 || !stats.frequencies) return false
  let sum = 0
  for (let n = 1; n <= 45; n++) {
    const v = stats.frequencies[n]
    if (!Number.isFinite(v)) return false
    sum += v
  }
  return sum === stats.totalDraws * 6
}
