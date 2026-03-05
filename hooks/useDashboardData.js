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

function toDateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function useDashboardData() {
  const [tickets, setTickets] = useState([])
  const [metrics, setMetrics] = useState({
    avgResolutionTime: 0,
    weeklyRecords: 0,
    monthlyRecords: 0,
    openTickets: 0,
    resolvedToday: 0,
    visitsByDay: [],
  })
  const [trends, setTrends] = useState({
    avgResolutionDiffMins: null,
    avgResolutionWorse: false,
    recordsPercentChange: null,
    openNeedsAttention: null,
    resolvedTodayPercentChange: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoIso = sevenDaysAgo.toISOString()

      const todayStart = getStartOfDay(now)
      const todayEnd = getEndOfDay(now)
      const yesterdayStart = getStartOfDay(new Date(now.getTime() - 86400000))
      const yesterdayEnd = getEndOfDay(new Date(now.getTime() - 86400000))

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfMonthIso = startOfMonth.toISOString()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const startOfLastMonthIso = startOfLastMonth.toISOString()

      const thisWeekStart = new Date(now)
      thisWeekStart.setDate(thisWeekStart.getDate() - now.getDay())
      thisWeekStart.setHours(0, 0, 0, 0)
      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(thisWeekStart)
      lastWeekEnd.setMilliseconds(-1)

      const sevenDaysAgoDate = sevenDaysAgo.toISOString().slice(0, 10)

      const [
        ticketsRes,
        visitsRes,
        monthlyRes,
        lastMonthRes,
      ] = await Promise.all([
        supabase.from("tickets").select("*"),
        supabase
          .from("patient_records")
          .select("visit_date")
          .gte("visit_date", sevenDaysAgoDate),
        supabase
          .from("patient_records")
          .select("id", { count: "exact", head: true })
          .gte("uploaded_at", startOfMonthIso),
        supabase
          .from("patient_records")
          .select("id", { count: "exact", head: true })
          .gte("uploaded_at", startOfLastMonthIso)
          .lt("uploaded_at", startOfMonthIso),
      ])

      if (ticketsRes.error) throw ticketsRes.error
      if (visitsRes.error) throw visitsRes.error

      const ticketList = ticketsRes.data ?? []
      const visitRows = visitsRes.data ?? []
      const monthlyRecords = monthlyRes?.count ?? 0
      const lastMonthRecords = lastMonthRes?.count ?? 0

      setTickets(ticketList)

      const byVisitDate = {}
      visitRows.forEach((r) => {
        const key = r.visit_date ? toDateKey(r.visit_date) : null
        if (key) byVisitDate[key] = (byVisitDate[key] || 0) + 1
      })

      const last7Days = getLast7Days()
      const visitsByDay = last7Days.map((date) => {
        const key = toDateKey(date)
        return {
          day: DAY_NAMES[date.getDay()],
          visits: byVisitDate[key] ?? 0,
        }
      })

      const resolvedTickets = ticketList.filter((t) => t.status === "Resolved")
      const resolutionTimes = resolvedTickets
        .map((t) => t.resolution_time_mins)
        .filter((n) => n != null && !Number.isNaN(Number(n)))
      const avgResolutionTime =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + Number(b), 0) / resolutionTimes.length
          : 0

      const thisWeekResolved = ticketList.filter((t) => {
        if (t.status !== "Resolved") return false
        const resolvedAt = t.resolved_at ?? t.updated_at ?? t.created_at
        if (!resolvedAt) return false
        const r = new Date(resolvedAt)
        return r >= thisWeekStart && r <= now
      })
      const lastWeekResolved = ticketList.filter((t) => {
        if (t.status !== "Resolved") return false
        const resolvedAt = t.resolved_at ?? t.updated_at ?? t.created_at
        if (!resolvedAt) return false
        const r = new Date(resolvedAt)
        return r >= lastWeekStart && r < thisWeekStart
      })
      const thisWeekMins = thisWeekResolved
        .map((t) => Number(t.resolution_time_mins))
        .filter((n) => !Number.isNaN(n))
      const lastWeekMins = lastWeekResolved
        .map((t) => Number(t.resolution_time_mins))
        .filter((n) => !Number.isNaN(n))
      const thisWeekAvg = thisWeekMins.length ? thisWeekMins.reduce((a, b) => a + b, 0) / thisWeekMins.length : 0
      const lastWeekAvg = lastWeekMins.length ? lastWeekMins.reduce((a, b) => a + b, 0) / lastWeekMins.length : 0
      const avgResolutionDiffMins = Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10
      const avgResolutionWorse = avgResolutionDiffMins > 0

      const recordsPercentChange =
        lastMonthRecords > 0
          ? Math.round(((monthlyRecords - lastMonthRecords) / lastMonthRecords) * 100)
          : (monthlyRecords > 0 ? 100 : null)

      const openTickets = ticketList.filter((t) => t.status === "Open").length
      const openStale = ticketList.filter((t) => {
        if (t.status !== "Open") return false
        const created = t.created_at ? new Date(t.created_at) : null
        return created && created <= sevenDaysAgo
      }).length
      const openNeedsAttention = openStale > 0 ? openStale : null

      const resolvedToday = ticketList.filter((t) => {
        if (t.status !== "Resolved") return false
        const resolvedAt = t.resolved_at ?? t.updated_at ?? t.created_at
        if (!resolvedAt) return false
        const r = new Date(resolvedAt)
        return r >= new Date(todayStart) && r <= new Date(todayEnd)
      }).length
      const resolvedYesterday = ticketList.filter((t) => {
        if (t.status !== "Resolved") return false
        const resolvedAt = t.resolved_at ?? t.updated_at ?? t.created_at
        if (!resolvedAt) return false
        const r = new Date(resolvedAt)
        return r >= new Date(yesterdayStart) && r <= new Date(yesterdayEnd)
      }).length
      const resolvedTodayPercentChange =
        resolvedYesterday > 0
          ? Math.round(((resolvedToday - resolvedYesterday) / resolvedYesterday) * 100)
          : (resolvedToday > 0 ? 100 : null)

      setMetrics({
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        weeklyRecords: visitRows.length,
        monthlyRecords,
        openTickets,
        resolvedToday,
        visitsByDay,
      })
      setTrends({
        avgResolutionDiffMins: lastWeekMins.length || thisWeekMins.length ? avgResolutionDiffMins : null,
        avgResolutionWorse,
        recordsPercentChange,
        openNeedsAttention,
        resolvedTodayPercentChange,
      })
    } catch (err) {
      setError(err?.message ?? "Failed to load dashboard data")
      setTickets([])
      setMetrics({
        avgResolutionTime: 0,
        weeklyRecords: 0,
        monthlyRecords: 0,
        openTickets: 0,
        resolvedToday: 0,
        visitsByDay: [],
      })
      setTrends({
        avgResolutionDiffMins: null,
        avgResolutionWorse: false,
        recordsPercentChange: null,
        openNeedsAttention: null,
        resolvedTodayPercentChange: null,
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

  return { metrics, tickets, loading, error, refetch: fetchData, trends }
}
