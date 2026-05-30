import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Unified messages redirect.
 * Reads the user's role from Supabase and forwards to the correct
 * messages page, preserving any ?groomer= query param.
 */
interface Props {
  searchParams: Promise<{ groomer?: string }>;
}

export default async function MessagesRedirectPage({ searchParams }: Props) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { groomer } = await searchParams;
  const suffix = groomer ? `?groomer=${groomer}` : "";

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("roles")
    .eq("clerk_id", user.id)
    .maybeSingle();

  const roles: string[] = profile?.roles ?? ["owner"];

  if (roles.includes("groomer")) {
    redirect(`/dashboard/groomer/messages${suffix}`);
  }

  redirect(`/dashboard/owner/messages${suffix}`);
}
