import { useEffect, useState } from 'react'

export function useLottoStats() {
  const [state, setState] = useState({ loading: true, error: null, stats: null })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/lotto-stats.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, stats: data })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: '통계 데이터를 불러올 수 없습니다', stats: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
