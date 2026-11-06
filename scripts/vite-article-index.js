// 글 목록용 가상 모듈. 꿈해몽·상식 글 230여 편의 본문을 메인 JS 번들에 싣지 않으려고 만들었다.
// - virtual:article-index : frontmatter(제목·설명·태그·날짜 등)만 담은 배열 → 메인 번들
// - virtual:article-text  : { slug: 본문 평문 } → 검색창을 쓸 때만 따로 내려받는 청크
// 본문 html은 src/lib/articles.js가 글마다 별도 청크로 지연 로드한다.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArticleMeta, parseArticle, htmlToText } from '../src/lib/markdown.js'

const DIRS = ['content/dreams', 'content/guides']
const IDS = { index: 'virtual:article-index', text: 'virtual:article-text' }

function files(root) {
  return DIRS.flatMap((d) => readdirSync(join(root, d)).filter((f) => f.endsWith('.md')).map((f) => join(root, d, f)))
}

export default function articleIndex() {
  let root = process.cwd()
  return {
    name: 'article-index',
    configResolved(config) { root = config.root },
    resolveId(id) {
      if (id === IDS.index || id === IDS.text) return '\0' + id
    },
    load(id) {
      if (id !== '\0' + IDS.index && id !== '\0' + IDS.text) return
      const paths = files(resolve(root))
      for (const p of paths) this.addWatchFile(p)
      const raws = paths.map((p) => readFileSync(p, 'utf-8'))
      if (id === '\0' + IDS.index) {
        return `export default ${JSON.stringify(raws.map(parseArticleMeta).filter(Boolean))}`
      }
      const text = {}
      for (const raw of raws) {
        const a = parseArticle(raw)
        if (a) text[a.slug] = htmlToText(a.html).replace(/\s+/g, ' ')
      }
      return `export default ${JSON.stringify(text)}`
    },
  }
}
