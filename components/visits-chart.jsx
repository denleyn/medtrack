"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">
          {payload[0].value} visits
        </p>
      </div>
    )
  }
  return null
}

export default function VisitsChart({ visitsByDay = [] }) {
  const data = Array.isArray(visitsByDay) && visitsByDay.length > 0
    ? visitsByDay
    : [{ day: "—", visits: 0 }]
  const totalVisits = data.reduce((sum, d) => sum + (d.visits ?? 0), 0)
  const avgVisits = data.length > 0 ? Math.round(totalVisits / data.length) : 0

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Patient Visits This Week
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Total: {totalVisits} visits &middot; Avg: {avgVisits}/day
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#0d9488" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dx={-4}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#visitGradient)"
                dot={{
                  r: 4,
                  fill: "#ffffff",
                  stroke: "#0d9488",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#0d9488",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
