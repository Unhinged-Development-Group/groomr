import { supabaseAdmin } from "@/lib/supabase-admin";

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** Generates a unique slug for a groomer profile. Appends -2, -3 … on collision. */
export async function generateUniqueGroomerSlug(
  businessName: string,
  excludeId?: string
): Promise<string> {
  const base = toSlug(businessName) || "groomer";
  let candidate = base;
  let attempt = 2;

  while (true) {
    let query = supabaseAdmin
      .from("groomer_profiles")
      .select("id")
      .eq("public_slug", candidate);

    if (excludeId) query = query.neq("id", excludeId);

    const { data } = await query.maybeSingle();
    if (!data) return candidate;

    candidate = `${base}-${attempt++}`;
  }
}
