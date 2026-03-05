"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

const THEME_KEY = "medtrack-theme"

function getStoredTheme() {
  if (typeof window === "undefined") return "light"
  return localStorage.getItem(THEME_KEY) || "light"
}

function applyTheme(theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
  localStorage.setItem(THEME_KEY, theme)
}

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [browserNotifications, setBrowserNotifications] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [generatingDemo, setGeneratingDemo] = useState(false)

  useEffect(() => {
    const theme = getStoredTheme()
    setDarkMode(theme === "dark")
    applyTheme(theme)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name != null) {
          setDisplayName(data.display_name)
        } else if (user?.user_metadata?.display_name) {
          setDisplayName(user.user_metadata.display_name)
        }
      })
  }, [user])

  function handleThemeChange(checked) {
    setDarkMode(checked)
    const theme = checked ? "dark" : "light"
    applyTheme(theme)
    toast.success(checked ? "Dark mode enabled" : "Light mode enabled")
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!user?.id) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: displayName || null,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err?.message ?? "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleGenerateDemoData() {
    setGeneratingDemo(true)
    try {
      const res = await fetch("/api/cron/seed", {
        headers: { authorization: "Bearer medtrack-cron-2026" }
      })
      const data = await res.json()
      toast.success(
        `Demo data generated! ${data.inserted?.patients ?? 0} patients and ${data.inserted?.tickets ?? 0} tickets added.`
      )
    } catch (err) {
      toast.error("Failed to generate demo data")
    } finally {
      setGeneratingDemo(false)
    }
  }

  function handleDeleteAccount() {
    setDeleteDialogOpen(false)
    supabase.auth.signOut().then(() => {
      router.replace("/login")
      toast.error("Account deletion must be completed via support. You have been signed out.")
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your email and display name. Changes are saved to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="e.g. Clinic Manager"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button
              type="submit"
              disabled={savingProfile}
              className="bg-teal text-white hover:bg-teal/90"
            >
              {savingProfile ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Switch between light and dark mode. The choice is saved for this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Dark mode</p>
              <p className="text-sm text-muted-foreground">
                Use the dark theme for the dashboard.
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={handleThemeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose how you want to be notified about alerts and updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Email alerts</p>
              <p className="text-sm text-muted-foreground">
                Receive high-priority alerts by email.
              </p>
            </div>
            <Switch
              checked={emailAlerts}
              onCheckedChange={setEmailAlerts}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Browser notifications</p>
              <p className="text-sm text-muted-foreground">
                Show desktop notifications for new high-priority tickets.
              </p>
            </div>
            <Switch
              checked={browserNotifications}
              onCheckedChange={setBrowserNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Demo Data */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Data</CardTitle>
          <CardDescription>
            Generate fresh demo data to keep the dashboard looking active for presentations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            disabled={generatingDemo}
            className="bg-blue-700 hover:bg-blue-800 text-white"
            onClick={handleGenerateDemoData}
          >
            {generatingDemo ? "Generating…" : "Generate Demo Data"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Adds new patient visits and tickets, and resolves old ones. Safe to run anytime.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. Delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out. Permanent account deletion must be completed
              through support. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, sign me out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}