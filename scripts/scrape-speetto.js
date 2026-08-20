import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStatus } from './speetto-normalize.js'
import { GAME_CODES, extractEpisodes, normalizeStores } from './speetto-store-normalize.js'
import { buildPayload } from './speetto-payload.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const MAX_ROUNDS = Number(process.env.MAX_ROUNDS ?? 30)
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 1000)
const OUT = fileURLToPath(new URL('../public/data/speetto.json', import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getCookie(homePath) {
  const res = await fetch(`${BASE}${homePath}`, { headers: { 'User-Agent': UA } })
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

const RETRIES = Number(process.env.RETRIES ?? 4)

async function getJson(path, cookie, referer) {
  let lastErr
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(5000 * 2 ** (attempt - 1)) // 5s, 10s, 20s, 40s
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: {
          'User-Agent': UA,
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${BASE}${referer}`,
          Cookie: cookie,
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
      return await res.json()
    } catch (err) {
      lastErr = err
      const cause = err.cause ? ` [${err.cause.code ?? err.cause.name}: ${err.cause.message}]` : ''
      console.error(`시도 ${attempt + 1}/${RETRIES + 1} 실패 (${path}): ${err.message}${cause}`)
    }
  }
  throw lastErr
}

// 1등 잔여 현황 (발행/소진 상태)
async function fetchRounds() {
  const cookie = await getCookie('/st/pblcnDsctn')
  const json = await getJson(
    '/st/selectPblcnDsctn.do?gdsType=&gdsPrice=&gdsStatus=&pageNum=1&recordCountPerPage=100',
    cookie,
    '/st/pblcnDsctn',
  )
  const list = json?.data?.list ?? []
  return buildStatus(list).rounds
}

// 당첨 판매점 (지역/판매점)
async function fetchStores() {
  let cookie = ''
  const referer = '/wnprchsplcsrch/home'
  const allStores = []

  for (const { code, name } of GAME_CODES) {
    let episodes = []
    try {
      await sleep(SLEEP_MS * 4)
      cookie = await getCookie('/wnprchsplcsrch/home')
      const epsdJson = await getJson(
        `/wnprchsplcsrch/selectStEpsdInfo.do?srchLtGdsCd=${code}`,
        cookie,
        referer,
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
          referer,
        )
        const stores = normalizeStores(shpJson, name, round)
        allStores.push(...stores)
        console.log(`[${name}] ${round}회: ${stores.length}건`)
      } catch (err) {
        console.error(`[${name}] ${round}회 실패: ${err.message}`)
      }
    }
  }

  return allStores
}

async function main() {
  const rounds = await fetchRounds()
  const stores = await fetchStores()

  const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
  const result = buildPayload({
    rounds,
    stores,
    previous,
    gameNames: GAME_CODES.map((g) => g.name),
    now: new Date().toISOString(),
  })
  if (!result) {
    console.error('1등 잔여 현황 스크래프가 불완전함 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }
  if (result.storesFellBack) {
    console.error('당첨 판매점 스크래프가 불완전함 — 기존 판매점 데이터를 유지하고 잔여 현황만 갱신')
  }

  const { payload } = result
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`회차 ${payload.rounds.length}개 · 판매점 ${payload.stores.length}건 저장 → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
