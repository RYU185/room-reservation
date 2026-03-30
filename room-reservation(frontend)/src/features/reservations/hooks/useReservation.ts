import { useState, useEffect, useCallback } from 'react'
import { getReservation } from '../api/reservations.api'
import type { Reservation } from '../types'

export function useReservation(id: number) {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getReservation(id)
      .then((data) => {
        if (!cancelled) setReservation(data)
      })
      .catch(() => {
        if (!cancelled) setError('예약 정보를 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => load(), [load])

  return { reservation, setReservation, loading, error, reload: load }
}
