import { NextResponse } from "next/server"

export async function GET() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl,
      hasSupabaseKey,
      hasServiceKey,
      nodeEnv: process.env.NODE_ENV,
    },
  })
}
