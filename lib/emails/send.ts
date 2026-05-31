import { resend, FROM_EMAIL } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { bookingConfirmationOwnerEmail } from "./booking-confirmation-owner";
import { bookingConfirmationGroomerEmail } from "./booking-confirmation-groomer";
import { appointmentCancelledEmail } from "./appointment-cancelled";
import { appointmentReminderEmail } from "./appointment-reminder";
import { reviewReminderEmail } from "./review-reminder";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.co";

// ---------------------------------------------------------------------------
// Internal data-fetch helpers
// ---------------------------------------------------------------------------

interface AppointmentEmailData {
  ownerName: string;
  ownerEmail: string;
  dogName: string;
  salonName: string;
  groomerEmail: string;
  groomerName: string;
  serviceName: string;
  scheduledAt: Date;
  address: string | null;
  cancellationReason: string | null;
  cancelledByOwner: boolean;
}

async function fetchAppointmentEmailData(
  appointmentId: string,
): Promise<AppointmentEmailData | null> {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      scheduled_at,
      service_snapshot_name,
      cancellation_reason,
      cancelled_by,
      owner_id,
      dogs ( name ),
      groomer_profiles (
        business_name,
        address_line_1,
        city,
        postcode,
        profiles ( full_name, email )
      ),
      profiles!appointments_owner_id_fkey ( full_name, email )
    `)
    .eq("id", appointmentId)
    .single();

  if (error || !data) {
    console.error("[email] fetchAppointmentEmailData error:", error?.message);
    return null;
  }

  const ownerProfileArr = data.profiles as { full_name: string | null; email: string | null }[] | null;
  const ownerProfile = Array.isArray(ownerProfileArr) ? ownerProfileArr[0] ?? null : ownerProfileArr;
  const gpArr = data.groomer_profiles as {
    business_name: string | null;
    address_line_1: string | null;
    city: string | null;
    postcode: string | null;
    profiles: { full_name: string | null; email: string | null }[] | null;
  }[] | null;
  const gp = Array.isArray(gpArr) ? gpArr[0] ?? null : gpArr;

  const ownerEmail = ownerProfile?.email ?? "";
  const ownerName  = ownerProfile?.full_name ?? "there";
  const dogName    = (data.dogs as { name: string } | null)?.name ?? "your dog";
  const salonName  = gp?.business_name ?? "the salon";

  const groomerOwnerProfile = gp?.profiles;
  const groomerEmail = groomerOwnerProfile?.email ?? "";
  const groomerName  = groomerOwnerProfile?.full_name ?? "there";

  const addressParts = [gp?.address_line_1, gp?.city, gp?.postcode].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : null;

  return {
    ownerName,
    ownerEmail,
    dogName,
    salonName,
    groomerEmail,
    groomerName,
    serviceName: data.service_snapshot_name ?? "Grooming",
    scheduledAt: new Date(data.scheduled_at),
    address,
    cancellationReason: data.cancellation_reason,
    cancelledByOwner: data.cancelled_by === data.owner_id,
  };
}

// ---------------------------------------------------------------------------
// Public send functions — call these from server actions
// ---------------------------------------------------------------------------

export async function sendBookingConfirmationEmails(appointmentId: string): Promise<void> {
  const d = await fetchAppointmentEmailData(appointmentId);
  if (!d) return;

  const ownerEmail = bookingConfirmationOwnerEmail({
    ownerName:   d.ownerName,
    dogName:     d.dogName,
    salonName:   d.salonName,
    serviceName: d.serviceName,
    scheduledAt: d.scheduledAt,
    address:     d.address,
    appUrl:      APP_URL,
  });

  const groomerEmail = bookingConfirmationGroomerEmail({
    groomerName: d.groomerName,
    ownerName:   d.ownerName,
    dogName:     d.dogName,
    serviceName: d.serviceName,
    scheduledAt: d.scheduledAt,
    appUrl:      APP_URL,
  });

  const sends = [];

  if (d.ownerEmail) {
    sends.push(
      resend.emails.send({
        from:    FROM_EMAIL,
        to:      d.ownerEmail,
        subject: ownerEmail.subject,
        html:    ownerEmail.html,
        text:    ownerEmail.text,
      }),
    );
  }

  if (d.groomerEmail) {
    sends.push(
      resend.emails.send({
        from:    FROM_EMAIL,
        to:      d.groomerEmail,
        subject: groomerEmail.subject,
        html:    groomerEmail.html,
        text:    groomerEmail.text,
      }),
    );
  }

  const results = await Promise.allSettled(sends);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[email] sendBookingConfirmationEmails send[${i}] failed:`, r.reason);
    }
  });
}

export async function sendCancellationEmails(appointmentId: string): Promise<void> {
  const d = await fetchAppointmentEmailData(appointmentId);
  if (!d) return;

  const toOwner = appointmentCancelledEmail({
    recipientName:   d.ownerName,
    dogName:         d.dogName,
    salonName:       d.salonName,
    serviceName:     d.serviceName,
    scheduledAt:     d.scheduledAt,
    cancelledByOwner: d.cancelledByOwner,
    reason:          d.cancellationReason,
    appUrl:          APP_URL,
  });

  const toGroomer = appointmentCancelledEmail({
    recipientName:   d.groomerName,
    dogName:         d.dogName,
    salonName:       d.salonName,
    serviceName:     d.serviceName,
    scheduledAt:     d.scheduledAt,
    cancelledByOwner: d.cancelledByOwner,
    reason:          d.cancellationReason,
    appUrl:          APP_URL,
  });

  const sends = [];

  if (d.ownerEmail) {
    sends.push(
      resend.emails.send({
        from:    FROM_EMAIL,
        to:      d.ownerEmail,
        subject: toOwner.subject,
        html:    toOwner.html,
        text:    toOwner.text,
      }),
    );
  }

  if (d.groomerEmail) {
    sends.push(
      resend.emails.send({
        from:    FROM_EMAIL,
        to:      d.groomerEmail,
        subject: toGroomer.subject,
        html:    toGroomer.html,
        text:    toGroomer.text,
      }),
    );
  }

  const results = await Promise.allSettled(sends);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[email] sendCancellationEmails send[${i}] failed:`, r.reason);
    }
  });
}

// ---------------------------------------------------------------------------
// Called from the cron route — sends 24h reminder for upcoming appointments
// ---------------------------------------------------------------------------

export async function sendAppointmentReminders(): Promise<{ sent: number; errors: number }> {
  const now     = new Date();
  const from    = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const to      = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      service_snapshot_name,
      dogs ( name ),
      groomer_profiles (
        business_name,
        address_line_1,
        city,
        postcode
      ),
      profiles!appointments_owner_id_fkey ( full_name, email )
    `)
    .eq("status", "confirmed")
    .gte("scheduled_at", from)
    .lte("scheduled_at", to);

  if (error || !appointments) {
    console.error("[email] sendAppointmentReminders fetch error:", error?.message);
    return { sent: 0, errors: 1 };
  }

  let sent = 0;
  let errors = 0;

  for (const apt of appointments) {
    const ownerProfile = apt.profiles as { full_name: string | null; email: string | null } | null;
    const gp = apt.groomer_profiles as {
      business_name: string | null;
      address_line_1: string | null;
      city: string | null;
      postcode: string | null;
    } | null;

    const ownerEmail = ownerProfile?.email;
    if (!ownerEmail) continue;

    const addressParts = [gp?.address_line_1, gp?.city, gp?.postcode].filter(Boolean);

    const email = appointmentReminderEmail({
      ownerName:   ownerProfile?.full_name ?? "there",
      dogName:     (apt.dogs as { name: string } | null)?.name ?? "your dog",
      salonName:   gp?.business_name ?? "your groomer",
      serviceName: apt.service_snapshot_name ?? "Grooming",
      scheduledAt: new Date(apt.scheduled_at),
      address:     addressParts.length > 0 ? addressParts.join(", ") : null,
      appUrl:      APP_URL,
    });

    const result = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      ownerEmail,
      subject: email.subject,
      html:    email.html,
      text:    email.text,
    });

    if (result.error) {
      console.error("[email] reminder send error for apt", apt.id, result.error);
      errors++;
    } else {
      sent++;
    }
  }

  return { sent, errors };
}

// ---------------------------------------------------------------------------
// Called from the cron route — sends review request for recently-completed appts
// ---------------------------------------------------------------------------

export async function sendReviewReminders(): Promise<{ sent: number; errors: number }> {
  // Target: appointments completed in the last 2 hours with no review yet
  const now  = new Date();
  const from = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error } = await supabaseAdmin
    .from("appointments")
    .select(`
      id,
      dogs ( name ),
      groomer_profiles ( business_name ),
      profiles!appointments_owner_id_fkey ( full_name, email ),
      reviews ( id )
    `)
    .eq("status", "completed")
    .gte("updated_at", from);

  if (error || !appointments) {
    console.error("[email] sendReviewReminders fetch error:", error?.message);
    return { sent: 0, errors: 1 };
  }

  let sent = 0;
  let errors = 0;

  for (const apt of appointments) {
    const reviews = apt.reviews as { id: string }[] | null;
    if (reviews && reviews.length > 0) continue; // already reviewed

    const ownerProfile = apt.profiles as { full_name: string | null; email: string | null } | null;
    const ownerEmail = ownerProfile?.email;
    if (!ownerEmail) continue;

    const email = reviewReminderEmail({
      ownerName:     ownerProfile?.full_name ?? "there",
      dogName:       (apt.dogs as { name: string } | null)?.name ?? "your dog",
      salonName:     (apt.groomer_profiles as { business_name: string | null } | null)?.business_name ?? "your groomer",
      appointmentId: apt.id,
      appUrl:        APP_URL,
    });

    const result = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      ownerEmail,
      subject: email.subject,
      html:    email.html,
      text:    email.text,
    });

    if (result.error) {
      console.error("[email] review reminder send error for apt", apt.id, result.error);
      errors++;
    } else {
      sent++;
    }
  }

  return { sent, errors };
}
