import { LottoBall } from './LottoBall.jsx'

export function NumberSet({ label, numbers }) {
  return (
    <div className="number-set">
      {label ? <span className="set-label">{label}</span> : null}
      <div className="set-balls">
        {numbers.map((n) => (
          <LottoBall key={n} number={n} />
        ))}
      </div>
    </div>
  )
}
