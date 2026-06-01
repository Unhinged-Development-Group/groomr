import { NextResponse } from "next/server";
import { sendAppointmentReminders, sendReviewReminders } from "@/lib/emails/send";
import { sendAppointmentReminderSMS } from "@/lib/sms/send";

// Vercel Cron: runs every hour on the hour
// vercel.json: { "crons": [{ "path": "/api/cron/notifications", "schedule": "0 * * * *" }] }

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reminders, reviews, smsReminders] = await Promise.all([
    sendAppointmentReminders(),
    sendReviewReminders(),
    sendAppointmentReminderSMS(),
  ]);

  console.log("[cron/notifications] reminders:", reminders, "reviews:", reviews, "smsReminders:", smsReminders);

  return NextResponse.json({ reminders, reviews, smsReminders });
}
