import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDraw, buildStats, isCompleteLottoStats } from './lotto-normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 250)
const OUT = fileURLToPath(new URL('../public/data/lotto-stats.json', import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const RETRIES = Number(process.env.RETRIES ?? 4)

// 동행복권은 GitHub Actions IP에서 간헐적으로 Connect Timeout을 내므로 백오프 재시도
async function withRetry(label, fn) {
  let lastErr
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(5000 * 2 ** (attempt - 1)) // 5s, 10s, 20s, 40s
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const cause = err.cause ? ` [${err.cause.code ?? err.cause.name}: ${err.cause.message}]` : ''
      console.error(`시도 ${attempt + 1}/${RETRIES + 1} 실패 (${label}): ${err.message}${cause}`)
    }
  }
  throw lastErr
}

async function getCookie() {
  return withRetry('/lt645/result', async () => {
    const res = await fetch(`${BASE}/lt645/result`, { headers: { 'User-Agent': UA } })
    const cookies = res.headers.getSetCookie?.() ?? []
    return cookies.map((c) => c.split(';')[0]).join('; ')
  })
}

async function getJson(path, cookie) {
  return withRetry(path, async () => {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${BASE}/lt645/result`,
        Cookie: cookie,
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
    return res.json()
  })
}

async function getLatestRound(cookie) {
  const j = await getJson(`/lt645/selectLtEpsdInfo.do?ltGmTypeCd=lt645`, cookie)
  const list = j?.data?.list ?? []
  return list.length ? Math.max(...list.map((x) => Number(x.ltEpsd))) : 0
}

async function main() {
  const cookie = await getCookie()
  const latest = await getLatestRound(cookie)
  if (!latest) {
    console.error('최신 회차를 가져오지 못함 — 비정상 종료')
    process.exit(1)
  }

  const seen = new Set()
  const draws = []

  let json = await getJson(
    `/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${latest}`,
    cookie,
  )
  let list = json?.data?.list ?? []

  while (list.length) {
    for (const item of list) {
      const d = parseDraw(item)
      if (!seen.has(d.round)) {
        seen.add(d.round)
        draws.push(d)
      }
    }
    const oldest = Math.min(...list.map((x) => Number(x.ltEpsd)))
    console.log(`수집 ${draws.length}회 (현재 최소 ${oldest})`)
    if (oldest <= 1) break
    await sleep(SLEEP_MS)
    json = await getJson(
      `/lt645/selectPstLt645InfoNew.do?srchDir=older&srchCursorLtEpsd=${oldest}`,
      cookie,
    )
    list = json?.data?.list ?? []
    const newOldest = list.length ? Math.min(...list.map((x) => Number(x.ltEpsd))) : 0
    if (newOldest >= oldest) break // 진전 없음 — 무한루프 방지
  }

  const stats = buildStats(draws)

  if (draws.length !== latest || !isCompleteLottoStats(stats)) {
    console.error(
      `불완전한 수집 (수집 ${draws.length}회 / 최신 ${latest}회) — 기존 JSON 보존을 위해 비정상 종료`,
    )
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), ...stats }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`총 ${stats.totalDraws}회차 저장 (최신 ${stats.latestRound}) → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
