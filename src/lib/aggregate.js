export function aggregateByRegion(stores) {
  const counts = new Map()
  for (const s of stores) {
    counts.set(s.region, (counts.get(s.region) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, 'ko'))
}

export function filterByRegion(stores, region) {
  if (region === null) return stores
  return stores.filter((s) => s.region === region)
}
