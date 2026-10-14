// 첫 화면 "새로 올라온 글". 화면(<LatestArticles />)과 정적 HTML(scripts/seo-pages.js)이 같이 쓴다.
// 검색에서 뺀 글(content/noindex.txt)은 고르지 않는다. 홈은 가장 중요한 페이지라 색인할 글로만 잇는다.
export function latestArticles(all, limit = 8) {
  return all
    .filter((a) => !a.noindex)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.order - a.order)
    .slice(0, limit)
}
