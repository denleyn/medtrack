"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Ticket } from "lucide-react"

export default function NewTicketDialog({
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
  initialTicket,
}) {
  const isEdit = Boolean(initialTicket?.id)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("")
  const [assignee, setAssignee] = useState("")
  const [status, setStatus] = useState("Open")

  useEffect(() => {
    if (open) {
      if (initialTicket) {
        setTitle(initialTicket.title ?? "")
        setDescription(initialTicket.description ?? "")
        setPriority(initialTicket.priority ?? "")
        setAssignee(initialTicket.assignee ?? "")
        setStatus(initialTicket.status ?? "Open")
      } else {
        setTitle("")
        setDescription("")
        setPriority("")
        setAssignee("")
        setStatus("Open")
      }
    }
  }, [open, initialTicket])

  function handleSubmit(e) {
    e.preventDefault()
    if (!title || !priority) return

    if (isEdit) {
      const newStatus = status || "Open"
      const wasResolved = initialTicket?.status === "Resolved"
      const isNowResolved = newStatus === "Resolved"
      let resolved_at = initialTicket?.resolved_at
      if (isNowResolved) {
        resolved_at = new Date().toISOString()
      } else if (wasResolved && !isNowResolved) {
        resolved_at = null
      }
      onUpdate?.(initialTicket.id, {
        title,
        description,
        priority,
        assignee: assignee || "Unassigned",
        status: newStatus,
        resolved_at,
      })
    } else {
      onSubmit?.({
        title,
        description,
        priority,
        assignee: assignee || "Unassigned",
      })
    }

    setTitle("")
    setDescription("")
    setPriority("")
    setAssignee("")
    setStatus("Open")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
              <Ticket className="h-5 w-5 text-teal" />
            </div>
            <div>
              <DialogTitle className="text-foreground">
                {isEdit ? "Edit Ticket" : "Create New Ticket"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update the IT support ticket details."
                  : "Submit a new IT support ticket for the clinic."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-title" className="text-foreground">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-title"
              placeholder="e.g. EHR system login failure"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card text-foreground"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-desc" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="ticket-desc"
              placeholder="Describe the issue in detail..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none bg-card text-foreground"
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ticket-priority" className="text-foreground">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full bg-card text-foreground">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="High">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ticket-assignee" className="text-foreground">
                Assignee
              </Label>
              <Input
                id="ticket-assignee"
                placeholder="e.g. John Smith"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="bg-card text-foreground"
              />
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="ticket-status" className="text-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-card text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-700 text-white hover:bg-blue-800"
              disabled={!title || !priority}
            >
              {isEdit ? "Update Ticket" : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
