// 빌드 후 라우트별 index.html 복사 → GitHub Pages에서 각 경로가 200으로 응답 (SEO)
import { mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const ROUTES = ['unse', 'gunghap', 'zodiac', 'saju', 'lotto', 'speetto']
const dist = 'dist'
for (const r of ROUTES) {
  mkdirSync(join(dist, r), { recursive: true })
  copyFileSync(join(dist, 'index.html'), join(dist, r, 'index.html'))
}
// 알 수 없는 경로 폴백 (404 상태로 앱 렌더)
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
console.log('routes:', ROUTES.join(', '), '+ 404.html')
