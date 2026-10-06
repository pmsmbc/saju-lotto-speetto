import { parseTags } from './tags.js'

// 아주 작은 마크다운 부분집합 변환기 (##, ###, -, 1., | 표 |, **굵게**, 문단)
// 글은 우리 저장소 파일만 다루지만 안전을 위해 이스케이프한다

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// [글자](/info/slug/) 형태의 내부 링크만 허용한다. 외부 URL·javascript: 등은 링크로 만들지 않는다.
const INTERNAL_LINK = /\[([^\]]+)\]\((\/[A-Za-z0-9\-_/]*)\)/g
// 문의 메일용. mailto: 뒤에는 메일 주소 하나만 허용한다(?bcc= 같은 추가 인자 불가).
const MAIL_LINK = /\[([^\]]+)\]\((mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\)/g

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(INTERNAL_LINK, '<a href="$2">$1</a>')
    .replace(MAIL_LINK, '<a href="$2">$1</a>')
}

// | 머리 | 머리 |
// |---|---|        ← 구분선은 버린다
// | 칸 | 칸 |
function table(lines) {
  const cells = (l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => inline(c.trim()))
  const rows = lines.filter((l) => !/^\|[\s:|-]+\|$/.test(l)).map(cells)
  const [head, ...body] = rows
  return `<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`
    + `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
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
    } else if (lines.every((l) => /^\d+\. /.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`)
    } else if (lines.length >= 2 && lines.every((l) => l.startsWith('|'))) {
      out.push(table(lines))
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
  // body(마크다운 원문)는 돌려주지 않는다 — html과 내용이 같아 번들에 두 번 실린다.
  return { ...meta, order: Number(meta.order ?? 999), tags: parseTags(meta.tags), html: mdToHtml(m[2].trim()) }
}
