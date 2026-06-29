export function RegionStats({ stats, selectedRegion, onSelectRegion }) {
  if (stats.length === 0) {
    return <p className="empty">현재 표시할 당첨 정보가 없습니다</p>
  }
  const max = Math.max(...stats.map((s) => s.count))
  return (
    <ul className="region-stats">
      {stats.map((s) => {
        const active = s.region === selectedRegion
        return (
          <li key={s.region}>
            <button
              type="button"
              className={active ? 'region-bar active' : 'region-bar'}
              onClick={() => onSelectRegion(active ? null : s.region)}
            >
              <span className="region-name">{s.region}</span>
              <span className="region-track">
                <span className="region-fill" style={{ width: `${(s.count / max) * 100}%` }} />
              </span>
              <span className="region-count">{s.count}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
