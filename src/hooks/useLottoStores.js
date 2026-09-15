import { useEffect, useState } from 'react'

export function useLottoStores() {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/lotto-stores.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: '배출점 데이터를 불러올 수 없습니다', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
