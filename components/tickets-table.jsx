"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import NewTicketDialog from "@/components/new-ticket-dialog"
import { useTickets } from "@/hooks/useTickets"
import { supabase } from "@/lib/supabase"

function truncateId(id) {
  if (!id) return ""
  return id.slice(0, 8) + "..."
}

const priorityConfig = {
  High: {
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
  Medium: {
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  Low: {
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
}

const statusConfig = {
  Open: {
    className: "bg-sky-500/10 text-sky-600 border-sky-200",
  },
  "In Progress": {
    className: "bg-violet-500/10 text-violet-600 border-violet-200",
  },
  Resolved: {
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
}

const ROWS_PER_PAGE = 6

function requestNotificationAndNotify(title, body, icon = "/favicon.ico") {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon })
    return
  }
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, { body, icon })
      }
    })
  }
}

export default function TicketsTable() {
  const { tickets, setTickets, loading, error, refetch, normalizeTicket } = useTickets()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ticketToEdit, setTicketToEdit] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = tickets.filter(
    (t) =>
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.assignee || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  )

  async function handleNewTicket(payload) {
    const tempId = "temp-" + Date.now()
    const optimistic = {
      id: tempId,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      assignee: payload.assignee,
      status: "Open",
      created_at: new Date().toISOString(),
      created: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }
    setTickets((prev) => [optimistic, ...prev])
    setCurrentPage(1)

    const { data, error: insertError } = await supabase
      .from("tickets")
      .insert({
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority,
        assignee: payload.assignee,
        status: "Open",
      })
      .select()
      .single()

    if (insertError) {
      setTickets((prev) => prev.filter((t) => t.id !== tempId))
      toast.error("Failed to create ticket")
      return
    }

    const inserted = normalizeTicket(data)
    setTickets((prev) => prev.map((t) => (t.id === tempId ? inserted : t)))
    toast.success("Ticket created")
    if (payload.priority === "High") {
      requestNotificationAndNotify(
        "🚨 High Priority Ticket Created",
        payload.title,
        "/favicon.ico"
      )
    }
  }

  async function handleUpdate(id, payload) {
    const previous = tickets.find((t) => t.id === id)
    if (!previous) return
    const optimistic = {
      ...previous,
      ...payload,
    }
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? optimistic : t))
    )

    const updatePayload = {
      title: payload.title,
      description: payload.description ?? null,
      priority: payload.priority,
      assignee: payload.assignee,
      status: payload.status ?? previous.status,
    }
    if (payload.hasOwnProperty("resolved_at")) {
      updatePayload.resolved_at = payload.resolved_at
    }

    const { data, error: updateError } = await supabase
      .from("tickets")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? previous : t))
      )
      toast.error("Failed to update ticket")
      return
    }
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? normalizeTicket(data) : t))
    )
    toast.success("Ticket updated")
    refetch()
  }

  function openEdit(ticket) {
    setTicketToEdit(ticket)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setTicketToEdit(null)
  }

  async function confirmDelete() {
    const id = deleteId
    setDeleteId(null)
    if (!id) return
    const previous = tickets.find((t) => t.id === id)
    if (!previous) return
    setTickets((prev) => prev.filter((t) => t.id !== id))
    setDeleting(true)

    const { error: deleteError } = await supabase
      .from("tickets")
      .delete()
      .eq("id", id)

    setDeleting(false)
    if (deleteError) {
      setTickets((prev) =>
        [...prev, previous].sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0
          const db = b.created_at ? new Date(b.created_at).getTime() : 0
          return db - da
        })
      )
      toast.error("Failed to delete ticket")
      return
    }
    toast.success("Ticket deleted")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center rounded-xl border border-border bg-card py-24">
          <p className="text-sm text-muted-foreground">Loading tickets…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-24">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const openCount = tickets.filter((t) => t.status === "Open").length
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
            <span className="text-sm font-bold text-sky-600">{openCount}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Open</p>
            <p className="text-sm font-semibold text-foreground">
              {openCount === 1 ? "ticket" : "tickets"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <span className="text-sm font-bold text-violet-600">{inProgressCount}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">In Progress</p>
            <p className="text-sm font-semibold text-foreground">
              {inProgressCount === 1 ? "ticket" : "tickets"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <span className="text-sm font-bold text-emerald-600">{resolvedCount}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Resolved</p>
            <p className="text-sm font-semibold text-foreground">
              {resolvedCount === 1 ? "ticket" : "tickets"}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="bg-card pl-9 text-foreground"
          />
        </div>
        <Button
          onClick={() => {
            setTicketToEdit(null)
            setDialogOpen(true)
          }}
          className="bg-teal text-white hover:bg-teal/90"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px] text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="w-[100px] text-muted-foreground">Priority</TableHead>
              <TableHead className="w-[120px] text-muted-foreground">Status</TableHead>
              <TableHead className="w-[140px] text-muted-foreground">Assignee</TableHead>
              <TableHead className="w-[120px] text-muted-foreground">Created</TableHead>
              <TableHead className="w-[100px] text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Ticket className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No tickets found.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="group transition-colors hover:bg-muted/30"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {truncateId(ticket.id)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {ticket.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={priorityConfig[ticket.priority]?.className}
                    >
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusConfig[ticket.status]?.className}
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {ticket.assignee}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ticket.created}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        aria-label={`Edit ticket ${ticket.title}`}
                        onClick={() => openEdit(ticket)}
                        disabled={String(ticket.id).startsWith("temp-")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                        aria-label={`Delete ticket ${ticket.title}`}
                        onClick={() => setDeleteId(ticket.id)}
                        disabled={String(ticket.id).startsWith("temp-")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length === 0
                ? 0
                : (currentPage - 1) * ROWS_PER_PAGE + 1}
            </span>
            {" - "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * ROWS_PER_PAGE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            tickets
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <NewTicketDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
        onSubmit={handleNewTicket}
        onUpdate={handleUpdate}
        initialTicket={ticketToEdit}
      />

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The ticket will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
