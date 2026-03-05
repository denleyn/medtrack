"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

function formatCreated(isoString) {
  if (!isoString) return ""
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function normalizeTicket(row) {
  return {
    ...row,
    created: formatCreated(row.created_at),
  }
}

export function useTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setError(null)
    const { data, error: e } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })
    if (e) {
      setError(e.message)
      setTickets([])
      return
    }
    setTickets((data ?? []).map(normalizeTicket))
  }, [])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { tickets, setTickets, loading, error, refetch, normalizeTicket }
}
