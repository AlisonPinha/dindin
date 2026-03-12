import { type NextRequest } from "next/server"

export const CSRF_COOKIE_NAME = "csrf-token"
export const CSRF_HEADER_NAME = "X-CSRF-Token"

/**
 * Generate a random CSRF token using crypto.randomUUID()
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID()
}

/**
 * Validate that the X-CSRF-Token header matches the csrf-token cookie.
 * Returns true if valid, false if invalid.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return false
  }

  return cookieToken === headerToken
}
