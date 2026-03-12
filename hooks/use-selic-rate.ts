"use client"

import useSWR from "swr"

interface SelicData {
  rate: number
  annualRate: number
  isLoading: boolean
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useSelicRate(): SelicData {
  const { data, isLoading } = useSWR<{ rate: number; annualRate: number }>(
    "/api/selic",
    fetcher,
    { dedupingInterval: 3600000 } // 1 hour
  )

  return {
    rate: data?.rate || 1.04,
    annualRate: data?.annualRate || 13.25,
    isLoading,
  }
}
