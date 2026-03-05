"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function AuthGuard({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading } = useAuth()

  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (loading) return
    if (isLoginPage) return
    if (!session) {
      router.replace("/login")
    }
  }, [loading, session, isLoginPage, router])

  if (isLoginPage) {
    return children
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-teal" aria-label="Loading" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return children
}
