// 아주 작은 마크다운 부분집합 변환기 (##, ###, -, **굵게**, 문단)
// 글은 우리 저장소 파일만 다루지만 안전을 위해 이스케이프한다

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export function mdToHtml(md) {
  const out = []
  let list = null
  const flushList = () => {
    if (list) {
      out.push(`<ul>${list.join('')}</ul>`)
      list = null
    }
  }
  for (const block of md.split(/\n{2,}/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    if (lines.every((l) => l.startsWith('- '))) {
      list = lines.map((l) => `<li>${inline(l.slice(2))}</li>`)
      flushList()
    } else if (lines[0].startsWith('### ')) {
      out.push(`<h3>${inline(lines[0].slice(4))}</h3>`)
    } else if (lines[0].startsWith('## ')) {
      out.push(`<h2>${inline(lines[0].slice(3))}</h2>`)
    } else {
      out.push(`<p>${lines.map(inline).join('<br />')}</p>`)
    }
  }
  flushList()
  return out.join('\n')
}

// --- frontmatter (--- 로 감싼 key: value) ---
export function parseArticle(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return null
  const meta = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { ...meta, order: Number(meta.order ?? 999), body: m[2].trim(), html: mdToHtml(m[2].trim()) }
}
