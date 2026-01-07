"use client"

import { useEffect } from "react"
import { Sidebar, Header, MobileNav, MobileSidebar } from "@/components/layout"
import { QuickTransactionFab } from "@/components/quick-transaction"
import { SkipLinks } from "@/components/shared/skip-links"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { useStore } from "@/hooks/use-store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setSidebarOpen, setFamilyMembers, setUser, user } = useStore()

  // Initialize with sample users if not set
  useEffect(() => {
    if (!user) {
      const now = new Date()
      const sampleUsers = [
        {
          id: "1",
          name: "Alison",
          email: "alison@familia.com",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alison",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "2",
          name: "Esposa",
          email: "esposa@familia.com",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
          createdAt: now,
          updatedAt: now,
        },
      ]
      setFamilyMembers(sampleUsers)
      setUser(sampleUsers[0])
    }
  }, [user, setUser, setFamilyMembers])

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Links para acessibilidade */}
      <SkipLinks />

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <nav id="main-navigation" aria-label="Navegação principal">
          <Sidebar />
        </nav>
      </div>

      {/* Mobile Sidebar with overlay */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Quick Transaction FAB */}
      <QuickTransactionFab />
    </div>
  )
}
