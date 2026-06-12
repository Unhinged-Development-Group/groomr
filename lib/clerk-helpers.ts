import { clerkClient } from "@clerk/nextjs/server";

export async function fetchClerkAvatarMap(clerkIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!clerkIds.length) return map;
  try {
    const clerk = await clerkClient();
    const { data: users } = await clerk.users.getUserList({ userId: clerkIds, limit: 100 });
    for (const u of users) map.set(u.id, u.imageUrl);
  } catch {
    // non-fatal — fall back to DB value
  }
  return map;
}
