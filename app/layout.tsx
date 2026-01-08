import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/notifications"

export const metadata: Metadata = {
  title: "FamFinance - Controle suas finanças",
  description: "Aplicativo de controle financeiro familiar",
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
        <NotificationProvider>
          {children}
        </NotificationProvider>
        <Toaster />
      </body>
    </html>
  )
}
