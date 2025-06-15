"use client"

import { useState, useEffect } from "react"

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean,
  options: UseInfiniteScrollOptions = {},
) {
  const [isFetching, setIsFetching] = useState(false)
  const [targetRef, setTargetRef] = useState<HTMLDivElement | null>(null)

  const { threshold = 1.0, rootMargin = "0px" } = options

  useEffect(() => {
    if (!targetRef || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetching) {
          setIsFetching(true)
          callback()
        }
      },
      {
        threshold,
        rootMargin,
      },
    )

    observer.observe(targetRef)

    return () => {
      if (targetRef) {
        observer.unobserve(targetRef)
      }
    }
  }, [targetRef, hasMore, loading, isFetching, callback, threshold, rootMargin])

  useEffect(() => {
    if (!loading) {
      setIsFetching(false)
    }
  }, [loading])

  return { targetRef: setTargetRef, isFetching }
}
