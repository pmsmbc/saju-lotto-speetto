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

export function resolveRegion(item) {
  if (item.region) return item.region
  const addr = item.shpAddr ?? ''
  for (const [prefix, label] of REGION_PREFIX) {
    if (addr.startsWith(prefix)) return label
  }
  return '기타'
}

export function extractEpisodes(apiJson) {
  const list = apiJson?.data?.list
  if (!Array.isArray(list)) return []
  return list.map((x) => x.ltEpsd)
}

export function normalizeStores(apiJson, gameName, round) {
  const list = apiJson?.data?.list
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    game: gameName,
    round,
    rank: Number(item.wnShpRnk),
    store: item.shpNm,
    address: item.shpAddr,
    region: resolveRegion(item),
  }))
}
