"use client"

import { useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { SearchProvider } from "@/context/search-context"

const SIDEBAR_WIDTH_EXPANDED = 260
const SIDEBAR_WIDTH_COLLAPSED = 72

export default function AppShell({ children }) {
  const pathname = usePathname()
  const isLogin = pathname === "/login"
  const mainRef = useRef(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED

  if (isLogin) {
    return children
  }

  return (
    <SearchProvider>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <div
          className="flex min-h-screen flex-1 flex-col overflow-hidden transition-[margin] duration-300"
          style={{ marginLeft: sidebarWidth }}
        >
          <Header mainRef={mainRef} />
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}
