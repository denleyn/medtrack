"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Ticket,
  Upload,
  HeartPulse,
  Settings,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Tickets", icon: Ticket, href: "/tickets" },
  { label: "Data Upload", icon: Upload, href: "/upload" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

export default function Sidebar({ collapsed = false, onCollapsedChange }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const sidebarWidth = collapsed ? 72 : 260

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-y-auto bg-slate-900 text-white transition-all duration-300"
      style={{ width: sidebarWidth }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-6 text-white transition-opacity hover:opacity-90"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal">
          <HeartPulse className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">
            MedTrack
          </span>
        )}
      </Link>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-700" />

      {/* Navigation */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        <span
          className={`mb-2 px-3 text-[11px] font-medium uppercase tracking-widest text-slate-400 ${
            collapsed ? "sr-only" : ""
          }`}
        >
          Menu
        </span>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal/20 text-teal-300"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? "text-teal-400" : "text-slate-400 group-hover:text-white"
                }`}
              />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Log Out / Log In */}
      <div className="mt-auto flex flex-col gap-1 px-3 pb-4">
        <div className="mx-1 mb-2 h-px bg-slate-700" />
        {user ? (
          <button
            type="button"
            onClick={async () => {
              await signOut()
              router.replace("/login")
            }}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-white" />
            {!collapsed && "Log Out"}
          </button>
        ) : (
          <Link
            href="/login"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogIn className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-white" />
            {!collapsed && "Log In"}
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => onCollapsedChange?.(!collapsed)}
        className="flex items-center justify-center border-t border-slate-700 py-3 text-slate-400 transition-colors hover:text-white"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  )
}
