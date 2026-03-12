"use client"

import { useCallback } from "react"
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf"

/**
 * Read the CSRF token from the csrf-token cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))

  return match ? match.split("=")[1] ?? null : null
}

/**
 * Hook that provides CSRF token and a fetch wrapper that includes it.
 */
export function useCsrf() {
  const token = getCsrfToken()

  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const csrfToken = getCsrfToken()
      const headers = new Headers(options.headers)

      if (csrfToken) {
        headers.set(CSRF_HEADER_NAME, csrfToken)
      }

      return fetch(url, {
        ...options,
        headers,
      })
    },
    []
  )

  return { token, csrfFetch }
}
