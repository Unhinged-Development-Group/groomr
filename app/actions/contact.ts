"use server";

import { resend, FROM_EMAIL } from "@/lib/resend";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendContactInquiry(
  groomerName: string,
  groomerProfileId: string,
  senderName: string,
  senderEmail: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const trimName    = senderName.trim();
  const trimEmail   = senderEmail.trim();
  const trimMessage = message.trim();

  if (!trimName || !trimEmail || !trimMessage) {
    return { ok: false, error: "Please fill in all fields" };
  }
  if (!isValidEmail(trimEmail)) {
    return { ok: false, error: "Please enter a valid email address" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "support@groomr.uk",
      subject: `New enquiry for ${groomerName} from ${trimName}`,
      text: [
        `Groomer: ${groomerName}`,
        `Groomer ID: ${groomerProfileId}`,
        `From: ${trimName} <${trimEmail}>`,
        ``,
        `Message:`,
        trimMessage,
      ].join("\n"),
    });
    return { ok: true };
  } catch (e) {
    console.error("Contact inquiry error:", e);
    return { ok: false, error: "Failed to send — please try again" };
  }
}

export async function submitReport(
  groomerName: string,
  groomerProfileId: string,
  reason: string,
  details: string
): Promise<{ ok: boolean; error?: string }> {
  if (!reason) return { ok: false, error: "Please select a reason" };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "support@groomr.uk",
      subject: `Listing report: ${groomerName}`,
      text: [
        `Groomer: ${groomerName}`,
        `Groomer ID: ${groomerProfileId}`,
        `Reason: ${reason}`,
        details.trim() ? `Details: ${details.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return { ok: true };
  } catch (e) {
    console.error("Report error:", e);
    return { ok: false, error: "Failed to submit — please try again" };
  }
}
