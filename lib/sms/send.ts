import { twilioClient, FROM_NUMBER } from "./client";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Low-level send wrapper — never throws
// ---------------------------------------------------------------------------

async function sendSMS(to: string, body: string): Promise<void> {
  try {
    await twilioClient.messages.create({ from: FROM_NUMBER, to, body });
  } catch (err) {
    console.error("[sms] send failed to", to, err);
  }
}

// ---------------------------------------------------------------------------
// Internal data fetcher — reuses the same joins as lib/emails/send.ts but
// also pulls phone + sms_notifications_enabled from the owner profile
// ---------------------------------------------------------------------------

interface AppointmentSMSData {
  ownerPhone: string;
  dogName: string;
  salonName: string;
  scheduledAt: Date;
}

async function fetchAppointmentSMSData(
  appointmentId: string,
): Promise<AppointmentSMSData | null> {
  const { data: apt, error: aptErr } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, dog_id, owner_id, groomer_profile_id")
    .eq("id", appointmentId)
    .single();

  if (aptErr || !apt) {
    console.error("[sms] apt fetch error:", aptErr?.message);
    return null;
  }

  const [ownerRes, dogRes, gpRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("phone, sms_notifications_enabled")
      .eq("id", apt.owner_id)
      .single(),
    supabaseAdmin.from("dogs").select("name").eq("id", apt.dog_id).single(),
    supabaseAdmin
      .from("groomer_profiles")
      .select("business_name")
      .eq("id", apt.groomer_profile_id)
      .single(),
  ]);

  const phone = ownerRes.data?.phone;
  const smsEnabled = ownerRes.data?.sms_notifications_enabled ?? true;

  if (!phone || !smsEnabled) return null;

  return {
    ownerPhone: phone,
    dogName: dogRes.data?.name ?? "your dog",
    salonName: gpRes.data?.business_name ?? "the salon",
    scheduledAt: new Date(apt.scheduled_at),
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Public send functions
// ---------------------------------------------------------------------------

export async function sendBookingConfirmationSMS(appointmentId: string): Promise<void> {
  const d = await fetchAppointmentSMSData(appointmentId);
  if (!d) return;

  const body =
    `Groomr: ${d.dogName} booked with ${d.salonName} on ${formatDate(d.scheduledAt)} at ${formatTime(d.scheduledAt)}. Reply STOP to opt out.`;

  await sendSMS(d.ownerPhone, body);
}

export async function sendCancellationSMS(appointmentId: string): Promise<void> {
  const d = await fetchAppointmentSMSData(appointmentId);
  if (!d) return;

  const body =
    `Groomr: Your appointment with ${d.salonName} on ${formatDate(d.scheduledAt)} at ${formatTime(d.scheduledAt)} has been cancelled.`;

  await sendSMS(d.ownerPhone, body);
}

// ---------------------------------------------------------------------------
// Called from cron — sends 24h reminder SMS for upcoming appointments
// ---------------------------------------------------------------------------

export async function sendAppointmentReminderSMS(): Promise<{ sent: number; errors: number }> {
  const now  = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const to   = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      dogs ( name ),
      groomer_profiles ( business_name ),
      profiles!appointments_owner_id_fkey ( phone, sms_notifications_enabled )
    `)
    .eq("status", "confirmed")
    .is("sms_reminder_sent_at", null)
    .gte("scheduled_at", from)
    .lte("scheduled_at", to);

  if (error || !appointments) {
    console.error("[sms] sendAppointmentReminderSMS fetch error:", error?.message);
    return { sent: 0, errors: 1 };
  }

  let sent = 0;
  let errors = 0;

  for (const apt of appointments) {
    const ownerRaw = apt.profiles as { phone: string | null; sms_notifications_enabled: boolean | null }[] | null;
    const owner = Array.isArray(ownerRaw) ? ownerRaw[0] ?? null : ownerRaw;
    const phone = owner?.phone;
    const smsEnabled = owner?.sms_notifications_enabled ?? true;

    if (!phone || !smsEnabled) continue;

    const gpRaw = apt.groomer_profiles as { business_name: string | null }[] | null;
    const gp = Array.isArray(gpRaw) ? gpRaw[0] ?? null : gpRaw;
    const dogRaw = apt.dogs as { name: string }[] | null;
    const dogName = (Array.isArray(dogRaw) ? dogRaw[0]?.name : null) ?? "your dog";

    const scheduledAt = new Date(apt.scheduled_at);
    const body =
      `Groomr: Reminder — ${dogName}'s appointment with ${gp?.business_name ?? "your groomer"} is tomorrow at ${formatTime(scheduledAt)}.`;

    try {
      await twilioClient.messages.create({ from: FROM_NUMBER, to: phone, body });
      await supabaseAdmin
        .from("appointments")
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq("id", apt.id);
      sent++;
    } catch (err) {
      console.error("[sms] reminder send error for apt", apt.id, err);
      errors++;
    }
  }

  return { sent, errors };
}
