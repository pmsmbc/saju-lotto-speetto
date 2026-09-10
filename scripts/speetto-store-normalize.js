export const GAME_CODES = [
  { code: 'LP35', name: '스피또2000' },
  { code: 'LP34', name: '스피또1000' },
  { code: 'LP33', name: '스피또500' },
]

// 주소 첫 어절(시·도) → 표준 약어
const REGION_PREFIX = [
  ['서울', '서울'],
  ['경기', '경기'],
  ['부산', '부산'],
  ['대구', '대구'],
  ['인천', '인천'],
  ['대전', '대전'],
  ['울산', '울산'],
  ['광주', '광주'],
  ['세종', '세종'],
  ['강원', '강원'],
  ['충북', '충북'],
  ['충청북', '충북'],
  ['충남', '충남'],
  ['충청남', '충남'],
  ['전북', '전북'],
  ['전라북', '전북'],
  ['전남', '전남'],
  ['전라남', '전남'],
  ['경북', '경북'],
  ['경상북', '경북'],
  ['경남', '경남'],
  ['경상남', '경남'],
  ['제주', '제주'],
  ['인터넷', '인터넷'],
]

// "(당첨 당시 상호) 명당복권" 같은 접두 안내문 제거
const stripLegacyPrefix = (v) => (typeof v === 'string' ? v.replace(/^\([^)]*\)\s*/, '').trim() : '')

// 폐점 판매점은 shpNm/shpAddr가 null로 오고, 당첨 당시 값이 *Asis / bef* 필드에 남는다.
export function resolveStoreName(item) {
  return item.shpNm?.trim() || item.shpNmAsis?.trim() || stripLegacyPrefix(item.befConmNm) || '미확인 판매점'
}

export function resolveAddress(item) {
  return item.shpAddr?.trim() || item.shpAddrAsis?.trim() || stripLegacyPrefix(item.befRdnm) || ''
}

// 주소로 시·도를 판단하고, 주소에서 알 수 없을 때만 API의 region 값을 쓴다.
// (API region은 폐점 건에서 '서울'로 잘못 오거나 '전남광주'처럼 두 지역이 합쳐져 온다)
export function resolveRegion(item) {
  const addr = resolveAddress(item)
  for (const [prefix, label] of REGION_PREFIX) {
    if (addr.startsWith(prefix)) return label
  }
  return item.region || '기타'
}

export function extractEpisodes(apiJson) {
  const list = apiJson?.data?.list
  if (!Array.isArray(list)) return []
  return list.map((x) => x.ltEpsd)
}

export function normalizeStores(apiJson, gameName, round) {
  const list = apiJson?.data?.list
  if (!Array.isArray(list)) return []
  return list
    .map((item) => ({
      game: gameName,
      round,
      rank: item.wnShpRnk == null || item.wnShpRnk === '' ? NaN : Number(item.wnShpRnk),
      store: resolveStoreName(item),
      address: resolveAddress(item),
      region: resolveRegion(item),
    }))
    .filter((s) => Number.isFinite(s.rank))
}

export function isCompleteScrape(stores, expectedGameNames) {
  if (!Array.isArray(stores) || stores.length === 0) return false
  const games = new Set(stores.map((s) => s.game))
  for (const name of expectedGameNames) {
    if (!games.has(name)) return false
  }
  return stores.every(
    (s) => typeof s.store === 'string' && s.store.length > 0 && Number.isFinite(s.rank),
  )
}
