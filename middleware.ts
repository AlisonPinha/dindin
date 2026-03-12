import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit, getClientIP, rateLimitConfigs } from "@/lib/rate-limit"

/**
 * Middleware for Supabase Auth session refresh + API protection
 *
 * This middleware:
 * 1. Refreshes the auth token if needed
 * 2. Updates cookies with the new session
 * 3. Protects dashboard routes (requires auth)
 * 4. Protects API routes (requires auth, except public endpoints)
 *
 * Note: If Supabase environment variables are not configured,
 * the middleware will pass through without auth handling.
 */

// APIs que NÃO precisam de autenticação
const PUBLIC_API_ROUTES = [
  "/api/auth/callback",
  "/api/auth/signout",
  "/api/health",
  "/api/quick-add",
]

// APIs que precisam de rate limit mais restritivo
const STRICT_RATE_LIMIT_ROUTES = [
  "/api/auth",
  "/api/ocr",
]

export async function middleware(request: NextRequest) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, pass through without auth handling
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Do NOT run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ===== API ROUTE PROTECTION =====
  if (pathname.startsWith("/api/")) {
    // Skip protection for public API routes
    const isPublicApi = PUBLIC_API_ROUTES.some((route) =>
      pathname.startsWith(route)
    )

    if (!isPublicApi && !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Apply rate limiting
    const isStrictRoute = STRICT_RATE_LIMIT_ROUTES.some((route) =>
      pathname.startsWith(route)
    )

    const clientIP = getClientIP(request)
    const rateLimitKey = `${clientIP}:${isStrictRoute ? "strict" : "normal"}`
    const config = isStrictRoute ? rateLimitConfigs.strict : rateLimitConfigs.normal
    const rateLimitResult = checkRateLimit(rateLimitKey, config.maxRequests, config.windowMs)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Limite de requisições excedido. Tente novamente em breve." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    supabaseResponse.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining))
    supabaseResponse.headers.set(
      "X-RateLimit-Policy",
      isStrictRoute ? "strict" : "normal"
    )

    return supabaseResponse
  }

  // ===== PAGE ROUTE PROTECTION =====
  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/transacoes", "/contas", "/investimentos", "/metas", "/configuracoes"]
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ["/login", "/signup", "/reset-password"]
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

/**
 * Configure which routes the middleware should run on
 * Includes API routes for protection
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (svg, png, jpg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
