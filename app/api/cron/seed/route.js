"use server"

import { supabase } from "@/lib/supabase"

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(list) {
  return list[randomInt(0, list.length - 1)]
}

function weightedPriority() {
  const r = Math.random()
  if (r < 0.5) return "Low"
  if (r < 0.8) return "Medium"
  return "High"
}

const DEPARTMENTS = ["ER", "Cardiology", "Pediatrics", "Orthopedics", "Neurology"]
const VISIT_TYPES = ["Emergency", "Checkup", "Follow-up", "Consultation"]
const OUTCOMES = ["Discharged", "Admitted", "Referred"]

const TICKET_TEMPLATES = [
  {
    title: "Workstation Unresponsive - Ward A",
    description:
      "Nursing workstation in Ward A is frozen and not responding to input. Staff cannot access the EMR.",
  },
  {
    title: "VPN Connection Issues",
    description:
      "Remote clinician is unable to connect to the hospital VPN. Authentication appears to succeed but connection drops immediately.",
  },
  {
    title: "Printer Offline - Floor 2",
    description:
      "Medication label printer on Floor 2 is showing as offline. Pharmacy staff cannot print new labels.",
  },
  {
    title: "EMR Sync Failure",
    description:
      "Several patient records are not syncing correctly between the EMR and the lab system. Lab results are missing from charts.",
  },
  {
    title: "Network Slowdown - Radiology",
    description:
      "Radiology workstations are experiencing slow loading times when retrieving imaging studies from PACS.",
  },
  {
    title: "Badge Scanner Error - Entrance B",
    description:
      "Staff badge scanner at Entrance B intermittently fails to read badges, causing access delays.",
  },
  {
    title: "Software Update Required - Billing",
    description:
      "Billing department workstations are prompting for a mandatory software update that requires IT approval.",
  },
  {
    title: "Monitor Flickering - ICU",
    description:
      "Primary monitor on the ICU central station is flickering, making it difficult to monitor patients.",
  },
  {
    title: "Backup Job Failed",
    description:
      "Nightly database backup job reported a failure. Logs indicate insufficient space on backup volume.",
  },
  {
    title: "Email System Delay",
    description:
      "Hospital-wide email is experiencing delays of 10–15 minutes for message delivery.",
  },
]

export async function GET(request) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const todayIsoDate = now.toISOString().slice(0, 10)

  // A) Insert new patient_records
  const patientCount = randomInt(8, 15)
  const patientRows = Array.from({ length: patientCount }).map(() => ({
    patient_id: `P-${randomInt(1000, 9999)}`,
    visit_date: todayIsoDate,
    department: pickRandom(DEPARTMENTS),
    visit_type: pickRandom(VISIT_TYPES),
    wait_time_mins: randomInt(8, 65),
    outcome: pickRandom(OUTCOMES),
    uploaded_at: now.toISOString(),
  }))

  let insertedPatients = 0
  let insertedTickets = 0
  let resolvedCount = 0

  if (patientRows.length > 0) {
    const { error: patientError } = await supabase
      .from("patient_records")
      .insert(patientRows)
    if (patientError) {
      return Response.json(
        { error: "Failed to insert patient records", details: patientError.message },
        { status: 500 }
      )
    }
    insertedPatients = patientRows.length
  }

  // B) Insert new tickets
  const ticketCount = randomInt(1, 3)
  const ticketRows = []
  for (let i = 0; i < ticketCount; i++) {
    const template = pickRandom(TICKET_TEMPLATES)
    ticketRows.push({
      title: template.title,
      description: template.description,
      priority: weightedPriority(),
      status: "Open",
      created_at: now.toISOString(),
    })
  }

  if (ticketRows.length > 0) {
    const { error: ticketError } = await supabase.from("tickets").insert(ticketRows)
    if (ticketError) {
      return Response.json(
        { error: "Failed to insert tickets", details: ticketError.message },
        { status: 500 }
      )
    }
    insertedTickets = ticketRows.length
  }

  // C) Resolve 1–2 of the oldest open tickets
  const { data: openTickets, error: openError } = await supabase
    .from("tickets")
    .select("id")
    .eq("status", "Open")
    .order("created_at", { ascending: true })
    .limit(5)

  if (!openError && openTickets && openTickets.length > 0) {
    const toResolveCount = Math.min(
      openTickets.length,
      randomInt(1, Math.min(2, openTickets.length))
    )
    const toResolve = [...openTickets]
      .sort(() => Math.random() - 0.5)
      .slice(0, toResolveCount)

    if (toResolve.length > 0) {
      const ids = toResolve.map((t) => t.id)
      const { error: resolveError } = await supabase
        .from("tickets")
        .update({
          status: "Resolved",
          resolved_at: now.toISOString(),
          resolution_time_mins: randomInt(10, 90),
        })
        .in("id", ids)

      if (!resolveError) {
        resolvedCount = ids.length
      }
    }
  }

  return Response.json({
    success: true,
    inserted: { patients: insertedPatients, tickets: insertedTickets },
    resolved: resolvedCount,
  })
}

