// 꿈해몽 글 분류 태그. id는 URL 슬러그(/info/tag/<id>/), label은 화면 표시용.
// desc는 태그별 정적 페이지의 소개 문단에 쓴다.
export const TAGS = [
  {
    id: 'animal',
    label: '동물',
    desc: '돼지·뱀·용·호랑이처럼 꿈에 나온 동물은 저마다 다른 기운을 뜻합니다. 동물이 등장하는 꿈의 전통 풀이를 모았습니다.',
  },
  {
    id: 'money',
    label: '재물·돈',
    desc: '똥꿈이 길몽인 이유부터 돈을 줍는 꿈, 금·보석 꿈까지 재물과 이어진다고 전해지는 꿈들을 모았습니다.',
  },
  {
    id: 'mind',
    label: '마음·심리',
    desc: '쫓기는 꿈, 시험 보는 꿈처럼 마음의 상태가 그대로 드러나는 꿈입니다. 전통 해몽과 심리학적 풀이를 함께 담았습니다.',
  },
  {
    id: 'people',
    label: '사람·관계',
    desc: '조상님, 연예인, 옛 애인처럼 꿈에 사람이 나올 때의 의미를 관계별로 정리했습니다.',
  },
  {
    id: 'taemong',
    label: '태몽·임신',
    desc: '태몽이란 무엇인지, 어떤 꿈을 태몽으로 보는지 정리했습니다. 성별 풀이는 전통 속설이며 의학적 근거가 없습니다.',
  },
  {
    id: 'nature',
    label: '자연·날씨',
    desc: '물·불·비·눈처럼 자연이 등장하는 꿈은 재물과 정화의 상징으로 자주 풀이됩니다.',
  },
  {
    id: 'body',
    label: '몸·변화',
    desc: '이빨이 빠지거나 머리카락을 자르는 꿈처럼 몸에 일어난 변화가 무엇을 뜻하는지 모았습니다.',
  },
  {
    id: 'life',
    label: '생활·사물',
    desc: '집·이사·신발처럼 일상의 터전과 물건이 나오는 꿈의 풀이를 모았습니다.',
  },
]

const BY_ID = new Map(TAGS.map((t) => [t.id, t]))

export function tagById(id) {
  return BY_ID.get(id) ?? null
}

// frontmatter의 "animal, money" 문자열을 유효한 태그 id 배열로 바꾼다.
// 알 수 없는 id는 버려서 오타가 화면에 새지 않게 한다.
export function parseTags(raw) {
  if (!raw) return []
  return [...new Set(String(raw).split(',').map((s) => s.trim()).filter((s) => BY_ID.has(s)))]
}

// 글 목록에서 실제로 쓰인 태그만, TAGS 순서대로 개수와 함께 돌려준다.
export function tagsWithCount(articles) {
  const count = new Map()
  for (const a of articles) {
    for (const id of a.tags ?? []) count.set(id, (count.get(id) ?? 0) + 1)
  }
  return TAGS.filter((t) => count.has(t.id)).map((t) => ({ ...t, count: count.get(t.id) }))
}
