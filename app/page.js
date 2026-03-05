"use client"

import { useEffect } from "react"
import MetricCards from "@/components/metric-cards"
import VisitsChart from "@/components/visits-chart"
import RecentActivity from "@/components/recent-activity"
import DashboardTicketsList from "@/components/dashboard-tickets-list"
import { useProfile } from "@/hooks/useProfile"
import { useTickets } from "@/hooks/useTickets"
import { useDashboardData } from "@/hooks/useDashboardData"

function useTicketMetrics(tickets) {
  const openTickets = tickets.filter((t) => t.status === "Open").length
  const todayStr = new Date().toDateString()
  const resolvedToday = tickets.filter(
    (t) =>
      t.resolved_at &&
      new Date(t.resolved_at).toDateString() === todayStr
  ).length
  const resolvedWithTime = tickets.filter(
    (t) => t.status === "Resolved" && t.resolution_time_mins != null && !Number.isNaN(Number(t.resolution_time_mins))
  )
  const avgResolutionTime =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, t) => sum + Number(t.resolution_time_mins), 0) / resolvedWithTime.length
      : null
  return { openTickets, resolvedToday, avgResolutionTime }
}

export default function DashboardPage() {
  const { displayName } = useProfile()
  const { tickets, refetch: refetchTickets } = useTickets()
  const { metrics: dashboardMetrics, refetch: refetchDashboard, trends } = useDashboardData()
  const { openTickets, resolvedToday, avgResolutionTime } = useTicketMetrics(tickets)

  useEffect(() => {
    const onDataUpdated = () => {
      refetchDashboard()
      refetchTickets()
    }
    window.addEventListener("medtrack:data-updated", onDataUpdated)
    return () => window.removeEventListener("medtrack:data-updated", onDataUpdated)
  }, [refetchDashboard, refetchTickets])

  const avgResolutionTrend =
    trends.avgResolutionDiffMins != null
      ? {
          diffMins: trends.avgResolutionDiffMins,
          worse: trends.avgResolutionWorse,
        }
      : null
  const recordsTrend =
    trends.recordsPercentChange != null
      ? { percentChange: trends.recordsPercentChange }
      : null
  const openTicketsTrend =
    trends.openNeedsAttention != null
      ? { needsAttention: trends.openNeedsAttention }
      : null
  const resolvedTodayTrend =
    trends.resolvedTodayPercentChange != null
      ? { percentChange: trends.resolvedTodayPercentChange }
      : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Good morning, {displayName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Here's an overview of your clinic operations today."}
        </p>
      </div>

      <MetricCards
        avgResolutionTime={avgResolutionTime}
        recordsProcessed={dashboardMetrics.monthlyRecords}
        openTickets={openTickets}
        resolvedToday={resolvedToday}
        avgResolutionTrend={avgResolutionTrend}
        recordsTrend={recordsTrend}
        openTicketsTrend={openTicketsTrend}
        resolvedTodayTrend={resolvedTodayTrend}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <VisitsChart visitsByDay={dashboardMetrics.visitsByDay} />
        <RecentActivity />
      </div>

      <DashboardTicketsList />
    </div>
  )
}
