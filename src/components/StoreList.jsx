export function StoreList({ stores }) {
  if (stores.length === 0) {
    return <p className="empty">조건에 맞는 당첨 판매점이 없습니다</p>
  }
  return (
    <ul className="store-list">
      {stores.map((s, i) => (
        <li key={`${s.game}-${s.round}-${s.store}-${i}`} className="store-item">
          <div className="store-head">
            <span className="store-game">{s.game} {s.round}회</span>
            <span className="store-rank">{s.rank}등</span>
          </div>
          <div className="store-name">{s.store}</div>
          <div className="store-addr">{s.address}</div>
        </li>
      ))}
    </ul>
  )
}
