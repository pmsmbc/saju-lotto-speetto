import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStatus, isCompleteSpeettoStatus } from './speetto-normalize.js'
import {
  GAME_CODES,
  extractEpisodes,
  normalizeStores,
  isCompleteScrape,
} from './speetto-store-normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const MAX_ROUNDS = Number(process.env.MAX_ROUNDS ?? 30)
const SLEEP_MS = Number(process.env.SLEEP_MS ?? 250)
const OUT = fileURLToPath(new URL('../public/data/speetto.json', import.meta.url))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getCookie(homePath) {
  const res = await fetch(`${BASE}${homePath}`, { headers: { 'User-Agent': UA } })
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function getJson(path, cookie, referer) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE}${referer}`,
      Cookie: cookie,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
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
  const cookie = await getCookie('/wnprchsplcsrch/home')
  const referer = '/wnprchsplcsrch/home'
  const allStores = []

  for (const { code, name } of GAME_CODES) {
    let episodes = []
    try {
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

  if (!isCompleteSpeettoStatus({ rounds })) {
    console.error('1등 잔여 현황 스크래프가 불완전함 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }
  if (!isCompleteScrape(stores, GAME_CODES.map((g) => g.name))) {
    console.error('당첨 판매점 스크래프가 불완전함 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), rounds, stores }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`회차 ${rounds.length}개 · 판매점 ${stores.length}건 저장 → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
