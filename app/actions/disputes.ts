"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resend, FROM_EMAIL } from "@/lib/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://groomr.uk";
const ADMIN_EMAIL = "notifications@groomr.uk";

async function getCallerProfile(): Promise<{ id: string } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();
  if (!data) return { error: "Profile not found" };
  return { id: data.id };
}

export interface DisputeView {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  raised_by: string | null;
  owner_comment: string | null;
  groomer_comment: string | null;
  proposed_resolution: string | null;
  resolution_proposed_at: string | null;
  owner_agreed: boolean | null;
  groomer_agreed: boolean | null;
  final_resolution: string | null;
  final_resolution_proposed_at: string | null;
  owner_agreed_final: boolean | null;
  groomer_agreed_final: boolean | null;
  owner_name: string | null;
  groomer_name: string | null;
  appointment_id: string | null;
  created_at: string;
  viewer_role: "owner" | "groomer";
}

export async function getDisputeForParty(
  disputeId: string
): Promise<{ data: DisputeView } | { error: string }> {
  const caller = await getCallerProfile();
  if ("error" in caller) return caller;

  const { data, error } = await supabaseAdmin
    .from("disputes")
    .select(`
      id, subject, description, status, raised_by,
      owner_id, groomer_id, appointment_id, created_at,
      owner_comment, groomer_comment,
      proposed_resolution, resolution_proposed_at, owner_agreed, groomer_agreed,
      final_resolution, final_resolution_proposed_at, owner_agreed_final, groomer_agreed_final,
      owner:profiles!disputes_owner_id_fkey ( full_name ),
      groomer:profiles!disputes_groomer_id_fkey ( full_name )
    `)
    .eq("id", disputeId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Dispute not found" };

  const d = data as any;
  const isOwner = d.owner_id === caller.id;
  const isGroomer = d.groomer_id === caller.id;

  if (!isOwner && !isGroomer) return { error: "Access denied" };

  return {
    data: {
      id: d.id,
      subject: d.subject,
      description: d.description,
      status: d.status,
      raised_by: d.raised_by,
      owner_comment: d.owner_comment,
      groomer_comment: d.groomer_comment,
      proposed_resolution: d.proposed_resolution,
      resolution_proposed_at: d.resolution_proposed_at,
      owner_agreed: d.owner_agreed,
      groomer_agreed: d.groomer_agreed,
      final_resolution: d.final_resolution,
      final_resolution_proposed_at: d.final_resolution_proposed_at,
      owner_agreed_final: d.owner_agreed_final,
      groomer_agreed_final: d.groomer_agreed_final,
      owner_name: d.owner?.full_name ?? null,
      groomer_name: d.groomer?.full_name ?? null,
      appointment_id: d.appointment_id,
      created_at: d.created_at,
      viewer_role: isOwner ? "owner" : "groomer",
    },
  };
}

export async function submitDisputeComment(
  disputeId: string,
  comment: string
): Promise<{ ok: boolean } | { error: string }> {
  const caller = await getCallerProfile();
  if ("error" in caller) return caller;

  const { data: d, error: fetchErr } = await supabaseAdmin
    .from("disputes")
    .select("id, owner_id, groomer_id, owner_comment, groomer_comment, status")
    .eq("id", disputeId)
    .maybeSingle();

  if (fetchErr || !d) return { error: fetchErr?.message ?? "Dispute not found" };

  const dAny = d as any;
  const isOwner = dAny.owner_id === caller.id;
  const isGroomer = dAny.groomer_id === caller.id;
  if (!isOwner && !isGroomer) return { error: "Access denied" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (isOwner) updates.owner_comment = comment;
  else updates.groomer_comment = comment;

  // Advance to 'open' once both parties have commented
  const ownerComment = isOwner ? comment : dAny.owner_comment;
  const groomerComment = isGroomer ? comment : dAny.groomer_comment;
  if (ownerComment && groomerComment && dAny.status === "pending") {
    updates.status = "open";
    resend.emails
      .send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: "Dispute update: both parties have submitted comments",
        text: `Both the owner and groomer have submitted their comments on dispute ID ${disputeId}.\n\nPlease review: ${APP_URL}/dashboard/admin`,
      })
      .catch(() => {});
  }

  const { error } = await supabaseAdmin
    .from("disputes")
    .update(updates)
    .eq("id", disputeId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function respondToDisputeResolution(
  disputeId: string,
  agreed: boolean
): Promise<{ ok: boolean } | { error: string }> {
  const caller = await getCallerProfile();
  if ("error" in caller) return caller;

  const { data, error: fetchErr } = await supabaseAdmin
    .from("disputes")
    .select(`
      id, owner_id, groomer_id, status, subject,
      owner_agreed, groomer_agreed, owner_agreed_final, groomer_agreed_final,
      owner:profiles!disputes_owner_id_fkey ( email, full_name ),
      groomer:profiles!disputes_groomer_id_fkey ( email, full_name )
    `)
    .eq("id", disputeId)
    .maybeSingle();

  if (fetchErr || !data) return { error: fetchErr?.message ?? "Dispute not found" };

  const d = data as any;
  const isOwner = d.owner_id === caller.id;
  const isGroomer = d.groomer_id === caller.id;
  if (!isOwner && !isGroomer) return { error: "Access denied" };

  const ownerEmail = d.owner?.email ?? null;
  const ownerName = d.owner?.full_name ?? "Owner";
  const groomerEmail = d.groomer?.email ?? null;
  const groomerName = d.groomer?.full_name ?? "Groomer";

  const isRound1 = d.status === "awaiting_agreement";
  const isRound2 = d.status === "awaiting_final_agreement";
  if (!isRound1 && !isRound2) return { error: "This dispute is not awaiting a response." };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (isRound1) {
    if (isOwner) updates.owner_agreed = agreed;
    else updates.groomer_agreed = agreed;

    const ownerAgreed = isOwner ? agreed : d.owner_agreed;
    const groomerAgreed = isGroomer ? agreed : d.groomer_agreed;

    if (ownerAgreed === true && groomerAgreed === true) {
      updates.status = "resolved";
      const confirmText = (name: string) =>
        `Hi ${name},\n\nBoth parties have accepted the proposed resolution for the dispute "${d.subject}". This dispute is now closed.\n\nThank you,\nThe Groomr team`;
      if (ownerEmail) resend.emails.send({ from: FROM_EMAIL, to: ownerEmail, subject: "Dispute resolved", text: confirmText(ownerName) }).catch(() => {});
      if (groomerEmail) resend.emails.send({ from: FROM_EMAIL, to: groomerEmail, subject: "Dispute resolved", text: confirmText(groomerName) }).catch(() => {});
    } else if (ownerAgreed === false || groomerAgreed === false) {
      updates.status = "final_review";
      const rejectingParty = agreed === false ? (isOwner ? ownerName : groomerName) : "A party";
      resend.emails
        .send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `Dispute resolution rejected — final review needed`,
          text: `${rejectingParty} has rejected the proposed resolution for dispute "${d.subject}" (ID: ${disputeId}).\n\nPlease send a final resolution: ${APP_URL}/dashboard/admin`,
        })
        .catch(() => {});
    }
  } else {
    // Round 2 — parties respond but admin manually closes
    if (isOwner) updates.owner_agreed_final = agreed;
    else updates.groomer_agreed_final = agreed;

    const partyName = isOwner ? ownerName : groomerName;
    resend.emails
      .send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `Final resolution ${agreed ? "accepted" : "rejected"} by ${partyName}`,
        text: `${partyName} has ${agreed ? "accepted" : "rejected"} the final resolution for dispute "${d.subject}" (ID: ${disputeId}).\n\nYou may now close the dispute: ${APP_URL}/dashboard/admin`,
      })
      .catch(() => {});
  }

  const { error: updateErr } = await supabaseAdmin
    .from("disputes")
    .update(updates)
    .eq("id", disputeId);

  if (updateErr) return { error: updateErr.message };
  return { ok: true };
}
