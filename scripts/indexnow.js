// IndexNow로 sitemap의 URL을 네이버·빙에 알린다 (구글은 IndexNow를 쓰지 않는다).
// 배포가 끝난 뒤 실행: node scripts/indexnow.js   (키 파일 public/<KEY>.txt 가 라이브에 있어야 한다)
const KEY = '781db320f55278742ef92869a228c6ee'
const HOST = 'satto.kr'
const ENDPOINTS = ['https://searchadvisor.naver.com/indexnow', 'https://api.indexnow.org/indexnow']

const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text()
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (urlList.length === 0) throw new Error('sitemap에 URL이 없다')

for (const endpoint of ENDPOINTS) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  })
  console.log(endpoint, res.status, urlList.length + '개', (await res.text()).slice(0, 200))
}
