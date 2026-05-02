"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface InviteInput {
  name: string;
  role: string;
  email: string;
}

export async function inviteTeamMember(
  groomerProfileId: string,
  input: InviteInput
): Promise<{ error?: string; teamMemberId?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  // Verify the caller owns this groomer profile
  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("id", groomerProfileId)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  // Check for an existing pending invite for this email
  const { data: existing } = await supabaseAdmin
    .from("team_members")
    .select("id, invite_status")
    .eq("groomer_profile_id", groomerProfileId)
    .eq("email", input.email)
    .maybeSingle();

  if (existing) {
    if (existing.invite_status === "accepted") return { error: "This person is already a team member." };
    if (existing.invite_status === "pending")  return { error: "An invite is already pending for this email." };
  }

  // Send Clerk invitation — Clerk emails the invite link
  let clerkInvitationId: string | null = null;
  try {
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: input.email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
      publicMetadata: {
        groomr_team_invite: true,
        groomer_profile_id: groomerProfileId,
      },
    });
    clerkInvitationId = invitation.id;
  } catch (err: any) {
    const clerkErrors = err?.errors?.[0];
    const msg = clerkErrors
      ? `Clerk: ${clerkErrors.message} (${clerkErrors.code})`
      : err instanceof Error ? err.message : "Failed to send invite email";
    return { error: msg };
  }

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("team_members")
    .insert({
      groomer_profile_id: groomerProfileId,
      name: input.name,
      role: input.role,
      email: input.email,
      invite_status: "pending",
      clerk_invitation_id: clerkInvitationId,
      since_year: new Date().getFullYear(),
      public_slug: `${slug}-at-profile`,
      average_rating: 0,
      total_reviews: 0,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Failed to save team member" };
  }

  return { teamMemberId: inserted.id };
}

export async function removeTeamMember(
  teamMemberId: string
): Promise<{ error?: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "Not authenticated" };

  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (!myProfile) return { error: "Profile not found" };

  // Verify ownership via the join
  const { data: member } = await supabaseAdmin
    .from("team_members")
    .select("id, clerk_invitation_id, invite_status, groomer_profile_id")
    .eq("id", teamMemberId)
    .maybeSingle();

  if (!member) return { error: "Team member not found" };

  const { data: gp } = await supabaseAdmin
    .from("groomer_profiles")
    .select("id")
    .eq("id", member.groomer_profile_id)
    .eq("user_id", myProfile.id)
    .maybeSingle();

  if (!gp) return { error: "Not authorised" };

  // Revoke pending Clerk invitation if it exists
  if (member.invite_status === "pending" && member.clerk_invitation_id) {
    try {
      const clerk = await clerkClient();
      await clerk.invitations.revokeInvitation(member.clerk_invitation_id);
    } catch {
      // Non-fatal — invitation may have already been used or expired
    }
  }

  const { error } = await supabaseAdmin
    .from("team_members")
    .delete()
    .eq("id", teamMemberId);

  if (error) return { error: error.message };
  return {};
}
