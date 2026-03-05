"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export function useProfile() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setDisplayName("Guest")
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const fromProfile = data?.display_name?.trim()
        const fromEmail = user.email ? user.email.split("@")[0] : ""
        setDisplayName(fromProfile || fromEmail || "Guest")
      })
      .catch(() => {
        if (!cancelled) {
          const fromEmail = user.email ? user.email.split("@")[0] : ""
          setDisplayName(fromEmail || "Guest")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user])

  return { displayName, loading }
}
