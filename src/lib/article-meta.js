// 글 머리 바이라인(누가·언제). React <InfoPage />와 정적 HTML(scripts/seo-pages.js)이 같이 쓴다.
// 운영 주체 이름은 operator.js 한 곳에서 바꾼다. /about/ 본문도 같이 고친다.
import { OPERATOR_NAME } from './operator.js'

export const AUTHOR_LABEL = OPERATOR_NAME
export const AUTHOR_HREF = '/about/'

// '2026-09-03' → '2026.09.03'
export const dotDate = (iso) => (iso ? String(iso).slice(0, 10).replace(/-/g, '.') : null)

// [{ text: '2026.09.03 작성' }, { text: '2026.10.06 수정' }] — 수정일이 작성일과 같거나 없으면 작성일만
export function articleDates(a) {
  const published = dotDate(a.date)
  const updated = dotDate(a.updated)
  const out = []
  if (published) out.push(`${published} 작성`)
  if (updated && updated !== published) out.push(`${updated} 수정`)
  return out
}
