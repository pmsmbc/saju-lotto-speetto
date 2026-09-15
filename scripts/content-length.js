// 글 본문의 실제 글자 수를 센다. 공백·마크다운 기호·링크 주소를 뺀 순수 본문 기준.
// 사용: node scripts/content-length.js            (전체 요약)
//       node scripts/content-length.js dreams/pig (특정 글)
import { readFileSync, readdirSync } from 'node:fs'

const DIRS = ['content/dreams', 'content/guides', 'content/pages']
export const TARGET = 1000

export function bodyChars(raw) {
  const body = raw.split(/^---$/m).slice(2).join('---')
  return body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 글자만 남긴다
    .replace(/[#*>`\-]/g, ' ') // 마크다운 기호 제거
    .replace(/\s+/g, '') // 공백 제거
    .length
}

function collect() {
  const rows = []
  for (const dir of DIRS) {
    let files = []
    try { files = readdirSync(dir).filter((f) => f.endsWith('.md')) } catch { continue }
    for (const f of files) {
      rows.push({ id: `${dir.split('/')[1]}/${f.replace('.md', '')}`, chars: bodyChars(readFileSync(`${dir}/${f}`, 'utf-8')) })
    }
  }
  return rows.sort((a, b) => a.chars - b.chars)
}

const arg = process.argv[2]
if (process.argv[1]?.endsWith('content-length.js')) {
  const rows = collect()
  const shown = arg ? rows.filter((r) => r.id.includes(arg)) : rows
  const short = rows.filter((r) => r.chars < TARGET)
  for (const r of shown) {
    console.log(`${String(r.chars).padStart(5)}자  ${r.chars < TARGET ? '부족' : '  ok'}  ${r.id}`)
  }
  console.log(`\n총 ${rows.length}편 · 평균 ${Math.round(rows.reduce((s, r) => s + r.chars, 0) / rows.length)}자 · ${TARGET}자 미만 ${short.length}편`)
}
