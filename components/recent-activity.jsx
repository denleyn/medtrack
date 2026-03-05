import {
  Clock,
  FileText,
  UserPlus,
  AlertCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const activities = [
  {
    icon: FileText,
    title: "Lab results uploaded",
    detail: "Dr. Sarah Kim — 12 patient records",
    time: "5 min ago",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: AlertCircle,
    title: "New IT ticket opened",
    detail: "Printer malfunction — Room 204",
    time: "18 min ago",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: UserPlus,
    title: "New patient registered",
    detail: "John D. — Insurance verified",
    time: "32 min ago",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Clock,
    title: "Ticket #1024 resolved",
    detail: "Network issue — IT Team",
    time: "1 hr ago",
    color: "text-teal",
    bg: "bg-teal/10",
  },
  {
    icon: FileText,
    title: "Monthly report exported",
    detail: "February 2026 — Compliance",
    time: "2 hr ago",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
]

export default function RecentActivity() {
  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {activities.map((activity, idx) => {
            const Icon = activity.icon
            return (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.bg}`}
                >
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {activity.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {activity.detail}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
