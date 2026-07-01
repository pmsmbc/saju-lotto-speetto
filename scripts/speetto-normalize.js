const GAME_CODES = new Set(['SP2000', 'SP1000', 'SP500'])

export function parseRnkRate(text) {
  const m = /^(\d+)매\/(\d+)매$/.exec(String(text ?? '').trim())
  if (!m) return { remaining: 0, total: 0 }
  return { remaining: Number(m[1]), total: Number(m[2]) }
}

export function parseRecord(raw) {
  const { remaining, total } = parseRnkRate(raw.stRnk1Rt)
  return {
    game: raw.stGmTypeNm,
    gameCode: raw.stGmTypeCd,
    round: Number(raw.stEpsd),
    status: raw.ntslStatus,
    rank1Remaining: remaining,
    rank1Total: total,
  }
}

export function buildStatus(list) {
  const rounds = (list ?? []).map(parseRecord).sort((a, b) => b.round - a.round)
  return { rounds }
}

export function isCompleteSpeettoStatus(payload) {
  const rounds = payload?.rounds
  if (!Array.isArray(rounds) || rounds.length === 0) return false
  const seen = new Set()
  for (const r of rounds) {
    if (!Number.isFinite(r.round)) return false
    if (!(r.rank1Total >= r.rank1Remaining && r.rank1Remaining >= 0)) return false
    if (GAME_CODES.has(r.gameCode)) seen.add(r.gameCode)
  }
  return seen.size === GAME_CODES.size
}
