// 홈 "글 모아보기"(<ArticleDirectory />)와 정적 HTML(scripts/seo-pages.js)이 같이 쓰는 글 묶음.
// 검색에 남긴 글(noindex 아님)만 첫 태그 기준으로 TAGS 순서대로 묶고, 상식 글은 맨 뒤에 둔다.
// 홈은 구글이 가장 자주 보는 페이지라, 홈 한 번 크롤로 색인할 글 전부가 발견되게 하는 용도다.
import { TAGS } from './tags.js'

export const GUIDE_GROUP = { id: 'guide', label: '사주·로또 상식' }
const ETC_GROUP = { id: 'etc', label: '그 밖의 꿈' }

// 글 제목에서 소재 이름만 뽑는다. '뱀꿈 해몽 — 길몽일까' → '뱀꿈', '죽는 꿈 해몽 — …' → '죽는 꿈'
export function shortName(title) {
  const head = String(title ?? '').split(/\s*[—,-]\s*/)[0]
  return head.replace(/\s*해몽.*$/, '').trim() || head.trim()
}

export const indexable = (all) => all.filter((a) => !a.noindex)

export function directoryGroups(all) {
  const kept = indexable(all)
  const dreams = kept.filter((a) => (a.category ?? 'dream') === 'dream')
  const guides = kept.filter((a) => a.category === 'guide')
  const byTag = new Map(TAGS.map((t) => [t.id, []]))
  const etc = []
  for (const a of dreams) {
    const first = (a.tags ?? []).find((id) => byTag.has(id))
    ;(first ? byTag.get(first) : etc).push(a)
  }
  const groups = TAGS.filter((t) => byTag.get(t.id).length > 0)
    .map((t) => ({ id: t.id, label: t.label, items: byTag.get(t.id) }))
  if (etc.length) groups.push({ ...ETC_GROUP, items: etc })
  if (guides.length) groups.push({ ...GUIDE_GROUP, items: guides })
  return groups
}
