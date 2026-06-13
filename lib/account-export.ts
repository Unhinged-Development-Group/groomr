"use server";

import { supabaseAdmin } from "./supabase-admin";
import { resend, FROM_EMAIL } from "./resend";
import { renderAccountDeletion } from "./emails/account-deletion";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function sendAccountDeletionEmail(
  profileId: string,
  email: string,
  name: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.uk";
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

  const { data: tokenRow } = await supabaseAdmin
    .from("account_export_tokens")
    .insert({ profile_id: profileId, expires_at: expiresAt.toISOString() })
    .select("token")
    .single();

  if (!tokenRow?.token) return;

  const downloadUrl = `${appUrl}/api/export/${tokenRow.token}`;
  const { subject, html, text } = await renderAccountDeletion({
    recipientName: name,
    downloadUrl,
    expiresAt,
    appUrl,
  });

  await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html, text }).catch(() => {});
}
