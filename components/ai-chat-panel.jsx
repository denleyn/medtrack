"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send } from "lucide-react"
import { useTickets } from "@/hooks/useTickets"

const QUICK_ACTIONS = [
  "What's our busiest day?",
  "Summarize open tickets",
  "Any High priority issues?",
]

export default function AiChatPanel() {
  const { tickets } = useTickets()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm MedTrack AI. Ask me anything about your clinic data.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(text) {
    const value = (text ?? input).trim()
    if (!value || loading) return

    setInput("")
    setMessages((prev) => [...prev, { id: Date.now() + "u", role: "user", content: value }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          tickets: tickets ?? [],
        }),
      })

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + "a", role: "assistant", content: data.reply || "No response." },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + "e", role: "assistant", content: "Error: " + err.message },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{ display: open ? "none" : "flex" }}
        className="fixed bottom-6 right-6 z-50 items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-800"
      >
        <Sparkles className="h-4 w-4" />
        AI Assistant
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col border-l bg-white shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-700" />
              <div>
                <p className="font-semibold text-sm">MedTrack AI</p>
                <p className="text-xs text-gray-400">Ask me about your clinic data</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "self-end bg-blue-700 text-white"
                    : "self-start bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-400">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 py-2 border-t flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                disabled={loading}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your clinic data..."
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="rounded-lg bg-blue-700 px-3 py-2 text-white hover:bg-blue-800 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}