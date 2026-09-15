// 글 검색. 모든 글이 이미 번들에 있으므로 별도 색인 파일이나 서버 없이 그 자리에서 훑는다.

// 비교용 정규화: 소문자 + 공백 제거.
// "돼지꿈"과 "돼지 꿈"을 같게 보기 위함이다.
export function normalize(s) {
  return String(s ?? '').toLowerCase().replace(/\s+/g, '')
}

// 본문 검색 대상 텍스트. articles.js가 미리 만들어 둔 text를 쓰고,
// 없으면 마크다운 원문이나 HTML에서 태그를 걷어낸 것을 쓴다.
export function searchableText(article) {
  if (article.text != null) return article.text
  if (article.body != null) return article.body
  return String(article.html ?? '').replace(/<[^>]*>/g, ' ')
}

// 제목 > 설명 > 본문 순으로 가중치를 준다. 0이면 해당 없음.
function scoreOf(article, q) {
  if (normalize(article.title).includes(q)) return 3
  if (normalize(article.description).includes(q)) return 2
  if (normalize(searchableText(article)).includes(q)) return 1
  return 0
}

// 검색어와 맞는 글을 점수 높은 순으로 돌려준다.
// 같은 점수면 원래 순서(order)를 지킨다.
export function searchArticles(articles, query) {
  const q = normalize(query)
  if (!q) return articles
  return articles
    .map((a) => ({ a, score: scoreOf(a, q) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || x.a.order - y.a.order)
    .map((x) => x.a)
}
