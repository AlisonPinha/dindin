"use client"

import { useState, useCallback, useMemo } from "react"

const CHECKIN_STORAGE_KEY = "dindin_last_checkin"

export function useMonthlyCheckin() {
  const [isOpen, setIsOpen] = useState(false)

  const shouldPrompt = useMemo(() => {
    if (typeof window === "undefined") return false
    const lastCheckin = localStorage.getItem(CHECKIN_STORAGE_KEY)
    if (!lastCheckin) return true

    const lastDate = new Date(lastCheckin)
    const now = new Date()

    // Prompt if different month
    return lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear()
  }, [])

  const markCheckinDone = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHECKIN_STORAGE_KEY, new Date().toISOString())
    }
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    setIsOpen,
    shouldPrompt,
    markCheckinDone,
  }
}
