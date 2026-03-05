"use client"

import { useState, useEffect, useCallback } from "react"
import { Ticket, UserCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

const REFRESH_MS = 30_000

const priorityClass = {
  High: "bg-red-500/10 text-red-600 border-red-200",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-200",
  Low: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
}

function timeAgo(isoString) {
  if (!isoString) return ""
  const d = new Date(isoString)
  const now = new Date()
  const sec = Math.floor((now - d) / 1000)
  if (sec < 60) return "Just now"
  if (sec < 3600) return `${Math.floor(sec / 60)} mins ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`
  return `${Math.floor(sec / 86400)} days ago`
}

export default function RecentActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRecent = useCallback(async () => {
    const [ticketsRes, recordsRes] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, title, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("patient_records")
        .select("id, patient_id, department, uploaded_at, created_at")
        .order("uploaded_at", { ascending: false })
        .limit(3),
    ])

    const tickets = (ticketsRes.data ?? []).map((t) => ({
      type: "ticket",
      id: t.id,
      title: t.title,
      priority: t.priority,
      date: t.created_at,
    }))

    const records = (recordsRes.data ?? []).map((r) => ({
      type: "record",
      id: r.id,
      department: r.department ?? "Visit",
      date: r.uploaded_at ?? r.created_at,
    }))

    const merged = [...tickets, ...records].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )
    setActivities(merged.slice(0, 6))
  }, [])

  useEffect(() => {
    fetchRecent().finally(() => setLoading(false))
    const interval = setInterval(fetchRecent, REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchRecent])

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((a) => (
              <div key={`${a.type}-${a.id}`} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {a.type === "ticket" ? (
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none text-foreground truncate">
                    {a.type === "ticket"
                      ? `New IT Ticket — ${a.title}`
                      : `Patient Visit — ${a.department}`}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {a.type === "ticket" ? (
                      <Badge
                        variant="outline"
                        className={priorityClass[a.priority] || ""}
                      >
                        {a.priority}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-teal-500/10 text-teal-600 border-teal-200"
                      >
                        Visit
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(a.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
