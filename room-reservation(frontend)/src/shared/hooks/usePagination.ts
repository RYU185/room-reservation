import { useState } from 'react'

interface UsePaginationOptions {
  initialPage?: number
  size?: number
}

export function usePagination({ initialPage = 1, size = 10 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage)

  function goToPage(newPage: number) {
    setPage(newPage)
  }

  function reset() {
    setPage(initialPage)
  }

  return { page, size, goToPage, reset }
}
