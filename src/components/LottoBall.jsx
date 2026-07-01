function ballColor(n) {
  if (n <= 10) return 'yellow'
  if (n <= 20) return 'blue'
  if (n <= 30) return 'red'
  if (n <= 40) return 'gray'
  return 'green'
}

export function LottoBall({ number }) {
  return <span className={`lotto-ball ball-${ballColor(number)}`}>{number}</span>
}
