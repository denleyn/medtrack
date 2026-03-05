"use client"

import {
  Clock,
  Database,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const colorMap = {
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
}

export default function MetricCards({
  avgResolutionTime = null,
  recordsProcessed = 0,
  openTickets = 0,
  resolvedToday = 0,
  avgResolutionTrend = null,
  recordsTrend = null,
  openTicketsTrend = null,
  resolvedTodayTrend = null,
}) {
  const avgDisplay =
    avgResolutionTime != null && avgResolutionTime > 0
      ? `${Math.round(avgResolutionTime)} mins`
      : "N/A"

  const metrics = [
    {
      title: "Avg Resolution Time",
      value: avgDisplay,
      color: "emerald",
      icon: Clock,
      trend:
        avgResolutionTrend != null && avgResolutionTrend.diffMins != null
          ? {
              text:
                avgResolutionTrend.worse
                  ? `▲ ${Math.abs(avgResolutionTrend.diffMins)} mins vs last week`
                  : `▼ ${Math.abs(avgResolutionTrend.diffMins)} mins vs last week`,
              className: avgResolutionTrend.worse
                ? "text-red-600"
                : "text-emerald-600",
            }
          : null,
    },
    {
      title: "Records Processed",
      value: String(recordsProcessed),
      color: "cyan",
      icon: Database,
      trend:
        recordsTrend != null && recordsTrend.percentChange != null
          ? {
              text: `${recordsTrend.percentChange >= 0 ? "+" : ""}${recordsTrend.percentChange}% vs last month`,
              className: "text-muted-foreground",
            }
          : null,
    },
    {
      title: "Open IT Tickets",
      value: String(openTickets),
      color: "amber",
      icon: AlertTriangle,
      trend:
        openTicketsTrend != null && openTicketsTrend.needsAttention != null
          ? {
              text: `+${openTicketsTrend.needsAttention} needs attention`,
              className: "text-orange-600",
            }
          : null,
    },
    {
      title: "Tickets Resolved Today",
      value: String(resolvedToday),
      color: "emerald",
      icon: CheckCircle,
      trend:
        resolvedTodayTrend != null &&
        resolvedTodayTrend.percentChange != null
          ? {
              text: `${resolvedTodayTrend.percentChange >= 0 ? "+" : ""}${resolvedTodayTrend.percentChange}% vs yesterday`,
              className: "text-emerald-600",
            }
          : null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const colors = colorMap[metric.color]
        return (
          <Card
            key={metric.title}
            className="relative overflow-hidden border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.iconBg}`}
              >
                <Icon className={`h-[18px] w-[18px] ${colors.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {metric.value}
              </p>
              {metric.trend && (
                <p
                  className={`mt-1 text-xs font-medium ${metric.trend.className}`}
                >
                  {metric.trend.text}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
