
# 🏥 MedTrack - Clinical Operations & Support Dashboard

A full-stack web application for clinic managers to monitor operations, manage IT support tickets, upload patient data, and get AI-powered insights. All in one place.

> Built as a portfolio project demonstrating full-stack development, database integration, and AI/LLM integration skills.

**[Live Demo](https://medtrack-eight.vercel.app/)** · **[GitHub](https://github.com/denleyn/medtrack)**

---

## 📸 Preview

> *<img width="1365" height="601" alt="Screenshot 2026-03-06 025133" src="https://github.com/user-attachments/assets/9bfda2c4-be62-4327-84ef-0ba06b82bfc9" />*

---

##  Features

###  Live Metric Tiles
Real-time KPIs pulled directly from the database. Average ticket resolution time, monthly records processed, open IT tickets, and tickets resolved today. Numbers update automatically every 30 seconds.

###  IT Support Ticket Manager (Full CRUD)
Create, read, update, and delete support tickets with priority levels (Low / Medium / High). High-priority ticket submissions trigger an instant browser notification. Includes status tracking (Open → In Progress → Resolved) with resolution timestamps.

###  AI Assistant Sidebar
An in-app AI chat panel powered by Groq (Llama 3) that reads live ticket data and answers natural language questions like *"What are our most urgent issues?"* or *"Summarize open tickets."* Responses stream in real time.

###  CSV Data Upload
Drag-and-drop CSV upload with client-side parsing (PapaParse), column mapping UI, batch insert to Supabase in chunks of 100, and a progress bar with success/error feedback.

###  Notification Center
Bell icon with live unread count showing High-priority tickets from the last 24 hours and tickets resolved today. Auto-refreshes every 30 seconds.

###  Daily Auto-Seeding (Demo Mode)
A Vercel cron job runs every 24 hours to auto-generate realistic patient records and support tickets, keeping the demo fresh for recruiters.

###  Authentication
Supabase Auth with sign up, sign in, and sign out. Display name stored in a profiles table and reflected throughout the UI.

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, JSX |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Groq API (Llama 3) |
| Charts | Recharts |
| CSV Parsing | PapaParse |
| Deployment | Vercel |

---

### Installation

```bash
git clone https://github.com/denleyn/medtrack.git
cd medtrack
npm install
```

##  Project Structure

```
medtrack/
├── app/
│   ├── api/
│   │   ├── ai/route.js          # Groq AI streaming endpoint
│   │   └── cron/seed/route.js   # Daily auto-seed cron job
│   ├── login/page.jsx           # Auth page
│   ├── tickets/page.jsx         # Ticket manager page
│   ├── upload/page.jsx          # CSV upload page
│   ├── settings/page.jsx        # User settings page
│   └── page.jsx                 # Main dashboard
├── components/
│   ├── ai-chat-panel.jsx        # AI sidebar with streaming
│   ├── tickets-table.jsx        # CRUD ticket table
│   ├── new-ticket-dialog.jsx    # Create/edit ticket modal
│   ├── sidebar.jsx              # Persistent navigation
│   └── app-shell.jsx            # Layout wrapper
├── hooks/
│   ├── useDashboardData.js      # Supabase metrics hook
│   ├── useTickets.js            # Tickets CRUD hook
│   └── useAuth.js               # Auth state hook
└── lib/
    └── supabase.js              # Supabase client
```

---

*Built by [Denley Ndokama](www.linkedin.com/in/denley-n)*
