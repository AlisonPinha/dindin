import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notifications"
import { PWARegister } from "@/components/pwa-register"
import { ErrorBoundary } from "@/components/error-boundary"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
}

export const metadata: Metadata = {
  title: "FamFinance - Controle suas finanças",
  description: "Aplicativo de controle financeiro familiar com regra 50-30-20",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FamFinance",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ErrorBoundary>
        <Toaster />
        <PWARegister />
      </body>
    </html>
  )
}
