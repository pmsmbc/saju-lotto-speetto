// content/noindex.txt → 검색에서 뺄 글 슬러그 집합. 한 줄에 하나, '#' 뒤는 주석.
// 슬러그 형식이 아닌 줄은 오류로 멈춘다. 오타가 나면 그 글이 조용히 색인되기 때문이다.
export function parseSlugList(text) {
  const set = new Set()
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(line)) throw new Error(`content/noindex.txt: 슬러그 형식이 아닙니다: "${line}"`)
    set.add(line)
  }
  return set
}
