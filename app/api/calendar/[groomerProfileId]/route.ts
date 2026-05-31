import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

function formatIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groomerProfileId: string }> }
) {
  const { groomerProfileId } = await params;

  const [{ data: appointments }, { data: profile }] = await Promise.all([
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
  ]);

  const calName = profile?.business_name || "Groomr Bookings";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Groomr//Groomr Calendar//EN",
    `X-WR-CALNAME:${esc(calName)}`,
    "X-WR-TIMEZONE:Europe/London",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const appt of appointments ?? []) {
    const start = new Date(appt.scheduled_at);
    const durationMins = (appt.service_snapshot_duration as number) || 60;
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
    const dogName = (appt.dogs as { name?: string } | null)?.name;
    const serviceName = (appt.service_snapshot_name as string) || "Appointment";
    const summary = dogName ? `${dogName} — ${serviceName}` : serviceName;
    const statusMap: Record<string, string> = {
      confirmed: "CONFIRMED",
      completed: "CONFIRMED",
      pending: "TENTATIVE",
    };

    lines.push(
      "BEGIN:VEVENT",
      `UID:${appt.id}@groomr.com`,
      `DTSTART:${formatIcalDate(start)}`,
      `DTEND:${formatIcalDate(end)}`,
      `SUMMARY:${esc(summary)}`,
      `STATUS:${statusMap[appt.status as string] ?? "TENTATIVE"}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
