import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { loadArticleHtml, hasArticleFile } from './lib/articles.js'

// 글 주소로 바로 들어오면 본문 청크를 먼저 받고 그린다. 그 사이에는 프리렌더 HTML이 그대로 보이므로
// "불러오는 중" 깜빡임과 레이아웃 이동(CLS)이 없다.
async function start() {
  const m = window.location.pathname.match(/^\/info\/([a-z]+(?:-[a-z]+)*)\/?$/)
  if (m && hasArticleFile(m[1])) {
    try { await loadArticleHtml(m[1]) } catch { /* 실패하면 InfoPage가 다시 시도한다 */ }
  }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

start()
