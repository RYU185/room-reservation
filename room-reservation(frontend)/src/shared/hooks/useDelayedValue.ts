import { useEffect, useState } from 'react'

export function useDelayedValue<T>(value: T, delay: number): T {
  const [delayedValue, setDelayedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDelayedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return delayedValue
}
