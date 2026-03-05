"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

const REFRESH_MS = 30_000
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getStartOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function getEndOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

export function useDashboardData() {
  const [tickets, setTickets] = useState([])
  const [metrics, setMetrics] = useState({
    avgResolutionTime: 0,
    weeklyRecords: 0,
    openTickets: 0,
    resolvedToday: 0,
    visitsByDay: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoIso = sevenDaysAgo.toISOString()

      const todayStart = getStartOfDay(new Date())
      const todayEnd = getEndOfDay(new Date())

      const [ticketsRes, recordsRes] = await Promise.all([
        supabase.from("tickets").select("*"),
        supabase
          .from("patient_records")
          .select("created_at")
          .gte("created_at", sevenDaysAgoIso),
      ])

      if (ticketsRes.error) throw ticketsRes.error
      if (recordsRes.error) throw recordsRes.error

      const ticketList = ticketsRes.data ?? []
      const records = recordsRes.data ?? []

      setTickets(ticketList)

      const resolvedTickets = ticketList.filter((t) => t.status === "Resolved")
      const resolutionTimes = resolvedTickets
        .map((t) => t.resolution_time_mins)
        .filter((n) => n != null && !Number.isNaN(Number(n)))
      const avgResolutionTime =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + Number(b), 0) / resolutionTimes.length
          : 0

      const openTickets = ticketList.filter((t) => t.status === "Open").length

      const resolvedToday = ticketList.filter((t) => {
        if (t.status !== "Resolved") return false
        const resolvedAt = t.resolved_at ?? t.updated_at ?? t.created_at
        if (!resolvedAt) return false
        const r = new Date(resolvedAt)
        return r >= new Date(todayStart) && r <= new Date(todayEnd)
      }).length

      const last7Days = getLast7Days()
      const visitsByDay = last7Days.map((date) => {
        const dayStart = getStartOfDay(date)
        const dayEnd = getEndOfDay(date)
        const visits = records.filter((r) => {
          const t = r.created_at ? new Date(r.created_at) : null
          return t && t >= new Date(dayStart) && t <= new Date(dayEnd)
        }).length
        return {
          day: DAY_NAMES[date.getDay()],
          visits,
        }
      })

      setMetrics({
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        weeklyRecords: records.length,
        openTickets,
        resolvedToday,
        visitsByDay,
      })
    } catch (err) {
      setError(err?.message ?? "Failed to load dashboard data")
      setTickets([])
      setMetrics({
        avgResolutionTime: 0,
        weeklyRecords: 0,
        openTickets: 0,
        resolvedToday: 0,
        visitsByDay: [],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  return { metrics, tickets, loading, error }
}
