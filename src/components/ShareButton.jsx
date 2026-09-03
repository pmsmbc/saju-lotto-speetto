import { useState } from 'react'

export default function ShareButton({ title, text, url }) {
  const [copied, setCopied] = useState(false)

  const onShare = async () => {
    const shareUrl = url ?? window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch {
        // 사용자가 공유를 취소한 경우 무시
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('아래 링크를 복사하세요', shareUrl)
    }
  }

  return (
    <button type="button" className="share-btn" onClick={onShare}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .09 1.2L8.7 8.9a3 3 0 1 0 0 6.2l6.4 3.7A3 3 0 1 0 16 16.6l-6.4-3.7a3 3 0 0 0 0-1.8L16 7.4c.55.38 1.24.6 2 .6Z" fill="currentColor" />
      </svg>
      {copied ? '링크 복사됨!' : '공유하기'}
    </button>
  )
}
