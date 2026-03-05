"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Search, X, AlertCircle, CheckCircle, Ticket } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSearch } from "@/context/search-context"
import { useTickets } from "@/hooks/useTickets"
import { useProfile } from "@/hooks/useProfile"

const NOTIFICATIONS_READ_KEY = "medtrack-notifications-read"

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function timeAgo(isoString) {
  if (!isoString) return ""
  const d = new Date(isoString)
  const now = new Date()
  const sec = Math.floor((now - d) / 1000)
  if (sec < 60) return "Just now"
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86400)}d ago`
}

function getNotifications(tickets) {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const list = []
  tickets.forEach((t) => {
    const created = t.created_at ? new Date(t.created_at) : null
    const updated = t.updated_at ? new Date(t.updated_at) : null
    if (t.priority === "High" && created && created >= oneDayAgo) {
      list.push({
        id: `high-${t.id}-${t.created_at}`,
        ticketId: t.id,
        type: "high",
        title: t.title,
        time: t.created_at,
        icon: AlertCircle,
      })
    }
    if (t.status === "Resolved") {
      const resolvedTime = updated || created
      if (resolvedTime && resolvedTime >= todayStart) {
        list.push({
          id: `resolved-${t.id}-${resolvedTime.toISOString()}`,
          ticketId: t.id,
          type: "resolved",
          title: t.title,
          time: resolvedTime.toISOString(),
          icon: CheckCircle,
        })
      }
    }
  })
  list.sort((a, b) => new Date(b.time) - new Date(a.time))
  return list
}

function getReadIds() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_READ_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function setReadIds(ids) {
  try {
    localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify([...ids]))
  } catch {}
}

export default function Header({ mainRef }) {
  const pathname = usePathname()
  const { title, subtitle } = {
    "/": { title: "Dashboard", subtitle: "Overview" },
    "/tickets": { title: "Tickets", subtitle: "IT Support Management" },
    "/upload": { title: "Data Upload", subtitle: "Import Records" },
    "/settings": { title: "Settings", subtitle: "Account & preferences" },
  }[pathname] || { title: "Dashboard", subtitle: "Overview" }

  const {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    openSearch,
    closeSearch,
  } = useSearch()
  const { tickets } = useTickets()
  const { displayName } = useProfile()
  const [readIds, setReadIdsState] = useState(() => getReadIds())

  const notifications = getNotifications(tickets)
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  const searchTrim = searchQuery.trim()
  const searchLower = searchTrim.toLowerCase()
  const filteredTickets = searchTrim
    ? tickets.filter((t) =>
        (t.title || "").toLowerCase().includes(searchLower)
      )
    : tickets
  const filteredCount = filteredTickets.length
  const totalCount = tickets.length
  const showSearchDropdown = isSearchOpen && searchTrim.length > 0

  const handleMarkAllRead = useCallback(() => {
    const next = new Set(readIds)
    notifications.forEach((n) => next.add(n.id))
    setReadIdsState(next)
    setReadIds(next)
  }, [notifications, readIds])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") closeSearch()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [closeSearch])

  function scrollToTop() {
    if (mainRef?.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: breadcrumb/title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <button
          type="button"
          onClick={scrollToTop}
          className="hidden text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline md:inline"
        >
          {subtitle}
        </button>
      </div>

      {/* Right: search, notifications, date, avatar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex items-center gap-2">
          {isSearchOpen ? (
            <>
              <div className="relative">
                <Input
                  placeholder="Search tickets by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-64 bg-background"
                  autoFocus
                />
                {showSearchDropdown && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md">
                    {filteredTickets.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No tickets found
                      </p>
                    ) : (
                      <ul className="py-1">
                        {filteredTickets.map((t) => (
                          <li key={t.id}>
                            <Link
                              href="/tickets"
                              onClick={closeSearch}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="truncate">{t.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {pathname === "/" && (
                <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                  Showing {filteredCount} of {totalCount} tickets
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={openSearch}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[10px]"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              {notifications.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleMarkAllRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No recent notifications
                </p>
              ) : (
                <ul className="py-2">
                  {notifications.map((n) => {
                    const Icon = n.icon
                    const isUnread = !readIds.has(n.id)
                    return (
                      <li
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-2.5 ${isUnread ? "bg-muted/50" : ""}`}
                      >
                        <Icon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${n.type === "high" ? "text-destructive" : "text-emerald-600"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(n.time)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Separator */}
        <div className="hidden h-6 w-px bg-border md:block" />

        {/* Date */}
        <span className="hidden text-sm text-muted-foreground lg:inline">
          {formatDate()}
        </span>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-teal text-[12px] font-semibold text-white">
              {displayName.slice(0, 2).toUpperCase() || "GU"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium leading-none text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </div>
    </header>
  )
}
