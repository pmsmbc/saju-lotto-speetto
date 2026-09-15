// 로또 1등 배출점 순위 수집.
// 동행복권은 회차별 배출점만 제공하므로 전 회차를 훑어 판매점 단위로 집계한다.
// 상태 파일 없이 매번 전량 수집한다 — 느리지만 항상 정확하고 병합 버그가 없다.
// 주의: /wnprchsplcsrch/* 는 GitHub Actions 러너에서 차단되므로 로컬(launchd)에서 돌린다.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStorePayload } from './lotto-store-normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36'
const OUT = fileURLToPath(new URL('../public/data/lotto-stores.json', import.meta.url))
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4)
const GAP_MS = Number(process.env.GAP_MS ?? 120)
const RETRIES = Number(process.env.RETRIES ?? 2)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getCookie() {
  const res = await fetch(`${BASE}/wnprchsplcsrch/home`, { headers: { 'User-Agent': UA } })
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
}

function headers(cookie) {
  return {
    'User-Agent': UA,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: `${BASE}/wnprchsplcsrch/home`,
    Cookie: cookie,
  }
}

async function fetchDraw(draw, h) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(1000 * attempt)
    try {
      const res = await fetch(
        `${BASE}/wnprchsplcsrch/selectLtWnShp.do?srchWnShpRnk=1&srchLtEpsd=${draw}`,
        { headers: h },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return json?.data?.list ?? []
    } catch (err) {
      if (attempt === RETRIES) {
        console.error(`회차 ${draw} 실패: ${err.message}`)
        return null
      }
    }
  }
}

async function main() {
  const cookie = await getCookie()
  const h = headers(cookie)

  const epsd = await (await fetch(`${BASE}/lt645/selectLtEpsdInfo.do`, { headers: h })).json()
  const draws = (epsd?.data?.list ?? []).map((x) => x.ltEpsd).filter(Number.isFinite).sort((a, b) => a - b)
  if (draws.length === 0) {
    console.error('회차 목록을 가져오지 못했습니다 — 기존 JSON 보존')
    process.exit(1)
  }
  console.log(`회차 ${draws.length}개(${draws[0]}~${draws.at(-1)}) 수집 시작`)

  const rows = []
  const missingDraws = []
  for (let i = 0; i < draws.length; i += CONCURRENCY) {
    const batch = draws.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map((d) => fetchDraw(d, h).then((list) => ({ d, list }))))
    for (const { d, list } of results) {
      if (list === null) missingDraws.push(d)
      else if (list.length === 0) missingDraws.push(d)
      else rows.push(...list.map((x) => ({ ...x, _draw: d })))
    }
    await sleep(GAP_MS)
  }

  const payload = buildStorePayload({ rows, draws, missingDraws, now: new Date().toISOString() })
  if (!payload) {
    console.error('수집이 불완전합니다 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }

  // 데이터가 줄어들면(수집 실패 가능성) 덮어쓰지 않는다
  const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  if (previous && payload.totalRecords < previous.totalRecords * 0.9) {
    console.error(`수집량이 이전보다 크게 줄었습니다(${previous.totalRecords} → ${payload.totalRecords}) — 보존`)
    process.exit(1)
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(
    `판매점 ${payload.storeCount}곳 · 1등 기록 ${payload.totalRecords}건 · ` +
      `${payload.fromDraw}~${payload.throughDraw}회(빠진 회차 ${payload.missingDraws.length}개) 저장 → ${OUT}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
