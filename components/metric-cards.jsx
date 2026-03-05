import {
  Clock,
  Database,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
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
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-600",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600",
  },
}

export default function MetricCards({ openTickets = 0, resolvedToday = 0 }) {
  const metrics = [
    {
      title: "Avg Resolution Time",
      value: "24 mins",
      change: "-12%",
      trend: "down",
      color: "emerald",
      icon: Clock,
      subtext: "vs. last week",
    },
    {
      title: "Records Processed",
      value: "1,200",
      change: "+8.2%",
      trend: "up",
      color: "cyan",
      icon: Database,
      subtext: "this month",
    },
    {
      title: "Open IT Tickets",
      value: String(openTickets),
      change: `+${openTickets}`,
      trend: "up",
      color: "amber",
      icon: AlertTriangle,
      subtext: "needs attention",
    },
    {
      title: "Tickets Resolved Today",
      value: String(resolvedToday),
      change: "+50%",
      trend: "up",
      color: "emerald",
      icon: CheckCircle,
      subtext: "vs. yesterday",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const colors = colorMap[metric.color]
        const isPositive =
          metric.color === "emerald" || metric.color === "cyan"

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
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${colors.badgeBg} ${colors.badgeText}`}
                    >
                      {metric.trend === "up" && metric.color !== "amber" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : metric.trend === "down" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      {metric.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {metric.subtext}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
