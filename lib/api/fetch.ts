import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf"

/**
 * Read the CSRF token from the csrf-token cookie (client-side only)
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))

  return match ? match.split("=")[1] ?? null : null
}

/** HTTP methods that require CSRF protection */
const MUTATION_METHODS = ["POST", "PUT", "DELETE", "PATCH"]

/**
 * Fetch wrapper that automatically includes the CSRF token header
 * for mutation requests (POST, PUT, DELETE, PATCH).
 *
 * Usage: drop-in replacement for fetch() in client-side code.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase()

  if (MUTATION_METHODS.includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      const headers = new Headers(options.headers)
      headers.set(CSRF_HEADER_NAME, csrfToken)
      return fetch(url, { ...options, headers })
    }
  }

  return fetch(url, options)
}
