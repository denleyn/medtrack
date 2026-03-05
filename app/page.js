"use client"

import MetricCards from "@/components/metric-cards"
import VisitsChart from "@/components/visits-chart"
import RecentActivity from "@/components/recent-activity"
import DashboardTicketsList from "@/components/dashboard-tickets-list"
import { useProfile } from "@/hooks/useProfile"
import { useTickets } from "@/hooks/useTickets"

function useTicketMetrics(tickets) {
  const openTickets = tickets.filter((t) => t.status === "Open").length
  const todayStr = new Date().toDateString()
  const resolvedToday = tickets.filter(
    (t) =>
      t.resolved_at &&
      new Date(t.resolved_at).toDateString() === todayStr
  ).length
  return { openTickets, resolvedToday }
}

export default function DashboardPage() {
  const { displayName } = useProfile()
  const { tickets } = useTickets()
  const { openTickets, resolvedToday } = useTicketMetrics(tickets)

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

      <MetricCards openTickets={openTickets} resolvedToday={resolvedToday} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <VisitsChart />
        <RecentActivity />
      </div>

      <DashboardTicketsList />
    </div>
  )
}
