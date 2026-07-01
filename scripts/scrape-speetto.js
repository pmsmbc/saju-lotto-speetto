import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStatus, isCompleteSpeettoStatus } from './speetto-normalize.js'

const BASE = 'https://www.dhlottery.co.kr'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const OUT = fileURLToPath(new URL('../public/data/speetto.json', import.meta.url))

async function getCookie() {
  const res = await fetch(`${BASE}/st/pblcnDsctn`, { headers: { 'User-Agent': UA } })
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(';')[0]).join('; ')
}

async function getJson(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE}/st/pblcnDsctn`,
      Cookie: cookie,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return res.json()
}

async function main() {
  const cookie = await getCookie()
  const json = await getJson(
    '/st/selectPblcnDsctn.do?gdsType=&gdsPrice=&gdsStatus=&pageNum=1&recordCountPerPage=100',
    cookie,
  )
  const list = json?.data?.list ?? []
  const status = buildStatus(list)

  if (!isCompleteSpeettoStatus(status)) {
    console.error('스크래프 결과가 불완전하거나 손상됨 — 기존 JSON 보존을 위해 비정상 종료')
    process.exit(1)
  }

  const payload = { updatedAt: new Date().toISOString(), ...status }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`총 ${status.rounds.length}개 회차 저장 → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
