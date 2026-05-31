import { NextResponse } from "next/server";
import { sendAppointmentReminders, sendReviewReminders } from "@/lib/emails/send";

// Vercel Cron: runs every hour on the hour
// vercel.json: { "crons": [{ "path": "/api/cron/notifications", "schedule": "0 * * * *" }] }

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reminders, reviews] = await Promise.all([
    sendAppointmentReminders(),
    sendReviewReminders(),
  ]);

  console.log("[cron/notifications] reminders:", reminders, "reviews:", reviews);

  return NextResponse.json({ reminders, reviews });
}
