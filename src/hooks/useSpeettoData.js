import { useEffect, useState } from 'react'

export function useSpeettoData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    updatedAt: null,
    rounds: [],
    stores: [],
  })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/speetto.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          updatedAt: data.updatedAt ?? null,
          rounds: data.rounds ?? [],
          stores: data.stores ?? [],
        })
      })
      .catch(() => {
        if (cancelled) return
        setState({
          loading: false,
          error: '데이터를 불러올 수 없습니다',
          updatedAt: null,
          rounds: [],
          stores: [],
        })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
