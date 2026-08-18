// 시/도 아래 하위 행정구역(시/군/구)이 없는 단층 지역
const SINGLE_TIER = new Set(['세종', '인터넷', '기타'])

// 판매점의 시/군/구까지 포함한 지역 라벨. 예: '경기 김포시', '서울 강남구'.
// 도는 시/군까지, 광역시/특별시는 구까지. 시 안의 구(창원시 마산합포구)는 시까지만.
export function areaOf(store) {
  const region = store.region || '기타'
  if (SINGLE_TIER.has(region)) return region
  const sub = (store.address ?? '').trim().split(/\s+/)[1]
  return sub ? `${region} ${sub}` : region
}

export function aggregateByArea(stores) {
  const counts = new Map()
  for (const s of stores) {
    const area = areaOf(s)
    counts.set(area, (counts.get(area) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, 'ko'))
}

export function filterByArea(stores, area) {
  if (area === null) return stores
  return stores.filter((s) => areaOf(s) === area)
}
