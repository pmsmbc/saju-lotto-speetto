// 한국 음력(dangi) 날짜 문자열. 예: '음력 7월 21일', 윤달이면 '음력 윤6월 1일'
export function lunarDateKorean(dateStr) {
  const parts = new Intl.DateTimeFormat('ko-KR-u-ca-dangi', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date(`${dateStr}T12:00:00+09:00`))
  const get = (t) => parts.find((p) => p.type === t)?.value ?? ''
  return `음력 ${get('month')}월 ${get('day')}일`
}

// 음력 → 양력 변환 (평달 기준, 윤달은 미지원 → null)
// 해당 음력 연도(설날~다음 설날 전)를 양력으로 하루씩 훑어 일치 날짜를 찾는다
const dangiFmt = new Intl.DateTimeFormat('ko-KR-u-ca-dangi', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric',
})

export function lunarToSolar(y, m, d) {
  if (!Number.isInteger(y) || m < 1 || m > 12 || d < 1 || d > 30) return null
  const start = Date.UTC(y, 0, 20) // 설날 최소치(1/21) 직전부터
  const end = Date.UTC(y + 1, 2, 1) // 음력 12월 말은 이듬해 2월까지
  for (let t = start; t <= end; t += 86400000) {
    const parts = dangiFmt.formatToParts(new Date(t + 12 * 3600000))
    const get = (type) => parts.find((p) => p.type === type)?.value
    if (Number(get('relatedYear')) === y && get('month') === String(m) && Number(get('day')) === d) {
      return new Date(t).toISOString().slice(0, 10)
    }
  }
  return null
}
