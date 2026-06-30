import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAME_CODES, extractEpisodes, normalizeStores, isCompleteScrape } from './normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const MAX_ROUNDS = Number(process.env.MAX_ROUNDS ?? 30)
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 250)

const OUT = fileURLToPath(new URL('../public/data/speetto.json', import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getCookie() {
  const res = await fetch(`${BASE}/wnprchsplcsrch/home`, {
    headers: { 'User-Agent': UA },
  })
  // Node fetch는 set-cookie를 getSetCookie()로 노출
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function getJson(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE}/wnprchsplcsrch/home`,
      Cookie: cookie,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

async function main() {
  const cookie = await getCookie()
  const allStores = []

  for (const { code, name } of GAME_CODES) {
    let episodes = []
    try {
      const epsdJson = await getJson(
        `/wnprchsplcsrch/selectStEpsdInfo.do?srchLtGdsCd=${code}`,
        cookie,
      )
      episodes = extractEpisodes(epsdJson).slice(0, MAX_ROUNDS)
    } catch (err) {
      console.error(`[${name}] 회차 목록 실패: ${err.message}`)
      continue
    }

    for (const round of episodes) {
      await sleep(SLEEP_MS)
      try {
        const shpJson = await getJson(
          `/wnprchsplcsrch/selectStWnShp.do?srchLtGdsCd=${code}&srchLtEpsd=${round}`,
          cookie,
        )
        const stores = normalizeStores(shpJson, name, round)
        allStores.push(...stores)
        console.log(`[${name}] ${round}회: ${stores.length}건`)
      } catch (err) {
        console.error(`[${name}] ${round}회 실패: ${err.message}`)
      }
    }
  }

  if (!isCompleteScrape(allStores, GAME_CODES.map((g) => g.name))) {
    console.error('스크래프 결과가 불완전하거나 손상됨 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), stores: allStores }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`총 ${allStores.length}건 저장 → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
