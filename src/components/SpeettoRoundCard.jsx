export function SpeettoRoundCard({ round, rank1Remaining, rank1Total }) {
  return (
    <div className="speetto-round">
      <span className="round-no">{round}회</span>
      <span className="rank1-remain">
        1등 잔여 {rank1Remaining}매/{rank1Total}매
      </span>
    </div>
  )
}
