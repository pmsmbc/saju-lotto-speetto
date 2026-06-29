export function RoundSelector({ rounds, value, onChange }) {
  return (
    <select
      className="round-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="회차 선택"
    >
      <option value="">전체</option>
      {rounds.map((r) => (
        <option key={`${r.game}#${r.round}`} value={`${r.game}#${r.round}`}>
          {r.label}
        </option>
      ))}
    </select>
  )
}
