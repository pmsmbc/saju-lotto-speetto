import { useState } from 'react'

// 우측 하단 고정 공유 버튼 — 현재 보고 있는 페이지를 그대로 공유
export default function FloatingShare() {
  const [copied, setCopied] = useState(false)

  const onShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: '사또 - 사주 로또 스피또', url })
      } catch {
        // 공유 취소 무시
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('아래 링크를 복사하세요', url)
    }
  }

  return (
    <button type="button" className="floating-share" aria-label="사이트 공유" onClick={onShare}>
      {copied ? (
        <span className="floating-copied">복사됨!</span>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .09 1.2L8.7 8.9a3 3 0 1 0 0 6.2l6.4 3.7A3 3 0 1 0 16 16.6l-6.4-3.7a3 3 0 0 0 0-1.8L16 7.4c.55.38 1.24.6 2 .6Z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
