import { useState, useEffect } from 'react'
import { getMyReservations } from '../api/reservations.api'
import type { Reservation, ReservationFilters } from '../types'
import type { PageMeta } from '@/shared/types'

export function useMyReservations(filters: ReservationFilters) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { status, from, to, page, size } = filters

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMyReservations({ status, from, to, page, size })
      .then(({ reservations: data, meta: m }) => {
        if (!cancelled) {
          setReservations(data)
          setMeta(m)
        }
      })
      .catch(() => {
        if (!cancelled) setError('예약 목록을 불러오는 데 실패했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [status, from, to, page, size])

  return { reservations, meta, loading, error }
}
