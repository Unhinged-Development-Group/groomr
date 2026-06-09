import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Format a date-only string (YYYY-MM-DD) as iCal DATE value
function formatIcalDateOnly(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

// RFC 5545 §3.1: fold lines longer than 75 octets
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

function esc(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Minimal VTIMEZONE for Europe/London (handles BST/GMT transitions)
const VTIMEZONE_LONDON = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/London",
  "BEGIN:STANDARD",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0000",
  "TZNAME:GMT",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T010000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
  "TZOFFSETFROM:+0000",
  "TZOFFSETTO:+0100",
  "TZNAME:BST",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
].join("\r\n");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groomerProfileId: string }> }
) {
  // 60 requests per IP per hour — generous for legitimate calendar clients
  // (polling multiple groomer feeds) while blocking enumeration scraping.
  if (checkRateLimit(req, "calendar-feed", { max: 60, windowMs: 60 * 60 * 1000 })) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const { groomerProfileId } = await params;

  const [{ data: appointments }, { data: profile }, { data: timeBlocks }] =
    await Promise.all([
      supabaseAdmin
        .from("appointments")
        .select("*, dogs (name)")
        .eq("groomer_profile_id", groomerProfileId)
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true }),
      supabaseAdmin
        .from("groomer_profiles")
        .select("business_name")
        .eq("id", groomerProfileId)
        .single(),
      supabaseAdmin
        .from("time_blocks")
        .select("*")
        .eq("groomer_profile_id", groomerProfileId),
    ]);

  const calName = profile?.business_name || "Groomr Bookings";
  const now = formatIcalDate(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Groomr//Groomr Calendar//EN",
    fold(`X-WR-CALNAME:${esc(calName)}`),
    "X-WR-TIMEZONE:Europe/London",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_LONDON,
  ];

  const statusMap: Record<string, string> = {
    confirmed: "CONFIRMED",
    completed: "CONFIRMED",
    pending: "TENTATIVE",
  };

  // Appointments
  for (const appt of appointments ?? []) {
    const start = new Date(appt.scheduled_at);
    const durationMins = (appt.service_snapshot_duration as number) || 60;
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
    const dogName = (appt.dogs as { name?: string } | null)?.name;
    const serviceName = (appt.service_snapshot_name as string) || "Appointment";
    const summary = dogName ? `${dogName} — ${serviceName}` : serviceName;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${appt.id}@groomr.uk`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcalDate(start)}`,
      `DTEND:${formatIcalDate(end)}`,
      fold(`SUMMARY:${esc(summary)}`),
      `STATUS:${statusMap[appt.status as string] ?? "TENTATIVE"}`,
      "END:VEVENT"
    );
  }

  // Time blocks (groomer-declared unavailability)
  for (const block of timeBlocks ?? []) {
    const uid = `tb-${block.id}@groomr.uk`;
    const summary = block.reason ? esc(block.reason as string) : "Unavailable";

    if (block.all_day) {
      // DATE-value events: DTEND is exclusive so advance end_date by 1 day
      const endDateObj = new Date(`${block.end_date}T00:00:00Z`);
      endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);
      const endDateStr = endDateObj.toISOString().slice(0, 10).replace(/-/g, "");

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${formatIcalDateOnly(block.start_date as string)}`,
        `DTEND;VALUE=DATE:${endDateStr}`,
        `SUMMARY:${summary}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    } else if (block.start_time && block.end_time) {
      // Partial-day block: stored as local Europe/London time
      const startStr = `${(block.start_date as string).replace(/-/g, "")}T${(block.start_time as string).replace(/:/g, "").slice(0, 6)}`;
      const endStr = `${(block.end_date as string).replace(/-/g, "")}T${(block.end_time as string).replace(/:/g, "").slice(0, 6)}`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;TZID=Europe/London:${startStr}`,
        `DTEND;TZID=Europe/London:${endStr}`,
        `SUMMARY:${summary}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");

  const safeName = calName.replace(/[^a-z0-9]/gi, "-");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Disposition": `attachment; filename="${safeName}.ics"`,
    },
  });
}
