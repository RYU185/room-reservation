import { useState, useEffect } from 'react'
import { getCalendar } from '../api/reservations.api'
import type { Reservation } from '../types'

export function useCalendar(year: number, month: number) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCalendar({ year, month })
      .then((data) => {
        if (!cancelled) setReservations(data)
      })
      .catch(() => {
        if (!cancelled) setError('캘린더 데이터를 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [year, month])

  return { reservations, loading, error }
}
