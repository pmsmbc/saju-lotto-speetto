// 한국 음력(dangi) 날짜 문자열. 예: '음력 7월 21일', 윤달이면 '음력 윤6월 1일'
export function lunarDateKorean(dateStr) {
  const parts = new Intl.DateTimeFormat('ko-KR-u-ca-dangi', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date(`${dateStr}T12:00:00+09:00`))
  const get = (t) => parts.find((p) => p.type === t)?.value ?? ''
  return `음력 ${get('month')}월 ${get('day')}일`
}
