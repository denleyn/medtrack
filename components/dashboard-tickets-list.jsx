"use client"

import { useSearch } from "@/context/search-context"
import { useTickets } from "@/hooks/useTickets"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const priorityClass = {
  High: "bg-red-500/10 text-red-600 border-red-200",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-200",
  Low: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
}

const statusClass = {
  Open: "bg-sky-500/10 text-sky-600 border-sky-200",
  "In Progress": "bg-violet-500/10 text-violet-600 border-violet-200",
  Resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
}

export default function DashboardTicketsList() {
  const { searchQuery } = useSearch()
  const { tickets, loading } = useTickets()

  const query = searchQuery.trim().toLowerCase()
  const filtered = query
    ? tickets.filter((t) => (t.title || "").toLowerCase().includes(query))
    : tickets

  if (loading) return null

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Tickets</CardTitle>
        <CardDescription>
          {query
            ? `Showing ${filtered.length} of ${tickets.length} tickets matching your search`
            : "Recent tickets"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {query ? "No tickets match your search." : "No tickets yet."}
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {filtered.slice(0, 10).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <span className="truncate font-medium text-foreground">
                    {t.title}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={priorityClass[t.priority] || ""}
                    >
                      {t.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={statusClass[t.status] || ""}
                    >
                      {t.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
            {filtered.length > 10 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Showing 10 of {filtered.length} tickets
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
