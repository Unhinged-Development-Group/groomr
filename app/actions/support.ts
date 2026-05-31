"use server";

import { resend, FROM_EMAIL } from "@/lib/resend";

export async function sendSupportRequest(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const name    = (formData.get("name")    as string | null)?.trim() ?? "";
  const email   = (formData.get("email")   as string | null)?.trim() ?? "";
  const subject = (formData.get("subject") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";
  const images  = formData.getAll("images") as File[];

  if (!name || !email || !subject || !message) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const attachments: Array<{ filename: string; content: Buffer }> = [];
  for (const image of images) {
    if (image.size === 0) continue;
    if (image.size > 5 * 1024 * 1024) {
      return { ok: false, error: `Image "${image.name}" exceeds the 5 MB limit.` };
    }
    const buffer = Buffer.from(await image.arrayBuffer());
    attachments.push({ filename: image.name, content: buffer });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to:   "support@groomr.uk",
      replyTo: email,
      subject: `[Support] ${subject}`,
      text: [
        `From: ${name} <${email}>`,
        `Subject: ${subject}`,
        ``,
        `Message:`,
        message,
        attachments.length
          ? `\n[${attachments.length} image${attachments.length > 1 ? "s" : ""} attached]`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      ...(attachments.length > 0 && { attachments }),
    });
    return { ok: true };
  } catch (e) {
    console.error("Support request error:", e);
    return { ok: false, error: "Failed to send — please try again shortly." };
  }
}
