// 로또 1등 배출점 집계. 동행복권 회차별 응답을 판매점 단위로 묶는다.
// 순수 함수만 두어 테스트 가능하게 유지한다.

export const TOP_LIMIT = 50

// 온라인 구매(동행복권 인터넷 판매)는 판매점이 아니므로 순위에서 분리한다.
export function isOnline(row) {
  return row?.region === '인터넷' || /인터넷\s*복권판매/.test(row?.shpNm ?? '')
}

// 동행복권 주소는 광주·전남을 "전남광주 광산구 …"처럼 묶어 보낸다 → 시·군·구로 구분
const GWANGJU_GU = new Set(['동구', '서구', '남구', '북구', '광산구'])

export function resolveRegion(row) {
  const addr = row?.shpAddr ?? ''
  if (addr.startsWith('전남광주')) {
    const sub = addr.split(/\s+/)[1] ?? ''
    return GWANGJU_GU.has(sub) ? '광주' : '전남'
  }
  return row?.region || '기타'
}

const keyOf = (row) => row.ltShpId || `${row.shpNm}|${row.shpAddr}`

// rows: [{ ltShpId, shpNm, shpAddr, region, atmtPsvYnTxt, _draw }, ...]
export function aggregateStores(rows) {
  const map = new Map()
  for (const row of rows ?? []) {
    if (isOnline(row)) continue
    if (!Number.isFinite(row._draw)) continue
    const key = keyOf(row)
    let e = map.get(key)
    if (!e) {
      e = { key, name: '', address: '', region: '기타', count: 0, auto: 0, manual: 0, firstDraw: row._draw, lastDraw: 0 }
      map.set(key, e)
    }
    e.count += 1
    if (row.atmtPsvYnTxt === '자동') e.auto += 1
    else if (row.atmtPsvYnTxt === '수동') e.manual += 1
    e.firstDraw = Math.min(e.firstDraw, row._draw)
    // 이름·주소는 가장 최근 회차의 값을 쓴다 (상호 변경 반영)
    if (row._draw >= e.lastDraw) {
      e.lastDraw = row._draw
      e.name = row.shpNm ?? e.name
      e.address = row.shpAddr ?? e.address
      e.region = resolveRegion(row)
    }
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.lastDraw - a.lastDraw || a.name.localeCompare(b.name, 'ko'))
    .map((e, i) => ({ rank: i + 1, ...e }))
}

export function onlineSummary(rows) {
  const on = (rows ?? []).filter(isOnline)
  return {
    count: on.length,
    auto: on.filter((r) => r.atmtPsvYnTxt === '자동').length,
    manual: on.filter((r) => r.atmtPsvYnTxt === '수동').length,
  }
}

// 수집이 불완전하면 null을 돌려 기존 데이터를 보존하게 한다.
export function buildStorePayload({ rows, draws, missingDraws, now, limit = TOP_LIMIT }) {
  const stores = aggregateStores(rows)
  if (stores.length < 100) return null // 정상 수집이면 수천 곳이 나온다
  const covered = draws.filter((d) => !missingDraws.includes(d))
  return {
    updatedAt: now,
    fromDraw: Math.min(...covered),
    throughDraw: Math.max(...covered),
    coveredDraws: covered.length,
    missingDraws,
    totalRecords: rows.length,
    storeCount: stores.length,
    online: onlineSummary(rows),
    top: stores.slice(0, limit).map(({ key, ...rest }) => rest),
  }
}
