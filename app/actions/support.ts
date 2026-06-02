"use server";

import { auth } from "@clerk/nextjs/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
    // Persist to DB so admin dashboard can view and reply
    const { userId } = await auth();
    let profileId: string | null = null;
    if (userId) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("clerk_id", userId)
        .maybeSingle();
      profileId = p?.id ?? null;
    }
    await supabaseAdmin.from("support_requests").insert({
      profile_id: profileId,
      name,
      email,
      subject,
      message,
    }).then(() => {/* non-fatal if this fails */});

    return { ok: true };
  } catch (e) {
    console.error("Support request error:", e);
    return { ok: false, error: "Failed to send — please try again shortly." };
  }
}
