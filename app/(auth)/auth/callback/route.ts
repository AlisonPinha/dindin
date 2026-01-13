import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

// Lista de rotas permitidas para redirecionamento (previne Open Redirect)
const ALLOWED_REDIRECTS = [
  "/dashboard",
  "/transacoes",
  "/contas",
  "/investimentos",
  "/metas",
  "/configuracoes",
]

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next")

  // Validar redirecionamento para prevenir Open Redirect
  const next = nextParam && ALLOWED_REDIRECTS.some(r => nextParam.startsWith(r))
    ? nextParam
    : "/dashboard"

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create user in database if not exists (for OAuth logins)
      try {
        const dbSupabase = createSupabaseServerClient()

        // Check if user already exists
        const { data: existingUser } = await dbSupabase
          .from("usuarios")
          .select("id")
          .eq("id", data.user.id)
          .single()

        if (!existingUser) {
          // Create user in our database
          const { error: insertError } = await dbSupabase
            .from("usuarios")
            .insert({
              id: data.user.id,
              nome: data.user.user_metadata?.full_name ||
                    data.user.user_metadata?.name ||
                    data.user.email?.split("@")[0] ||
                    "Usuário",
              email: data.user.email || "",
              avatar: data.user.user_metadata?.avatar_url || null,
              is_onboarded: false,
            })

          if (insertError) {
            console.error("Error creating user in database:", insertError)
          }
        }
      } catch (dbError) {
        console.error("Error checking/creating user:", dbError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
