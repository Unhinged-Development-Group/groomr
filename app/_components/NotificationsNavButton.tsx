"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getNotificationsNavContext } from "@/app/actions/notifications";
import { NotificationsIcon } from "@/components/ui/GroomrIcons";

export function NotificationsNavButton() {
  const pathname = usePathname();
  const [groomerProfileId, setGroomerProfileId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const isOnNotificationsPage = pathname.includes("/notifications");

  const refreshCount = useCallback(async () => {
    const ctx = await getNotificationsNavContext();
    if (!ctx) {
      setLoaded(true);
      return;
    }
    setGroomerProfileId(ctx.groomerProfileId);
    setUnread((prev) => {
      if (isOnNotificationsPage) return 0;
      return Math.max(prev, ctx.unreadCount);
    });
    setLoaded(true);
  }, [isOnNotificationsPage]);

  // Initial load + realtime subscription
  useEffect(() => {
    refreshCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to realtime broadcasts when we have the groomer profile ID
  useEffect(() => {
    if (!groomerProfileId) return;

    const ch = supabase
      .channel(`notifications:${groomerProfileId}`)
      .on("broadcast", { event: "new_notification" }, () => {
        if (!isOnNotificationsPage) setUnread((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [groomerProfileId, isOnNotificationsPage]);

  // Poll every 30 s as fallback
  useEffect(() => {
    const id = setInterval(refreshCount, 30_000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Clear dot when landing on notifications page
  useEffect(() => {
    if (isOnNotificationsPage) setUnread(0);
  }, [isOnNotificationsPage]);

  // Don't render for non-groomers (groomerProfileId stays null)
  if (!loaded || groomerProfileId === null) return null;

  return (
    <Link
      href="/dashboard/groomer/notifications"
      aria-label="Notifications"
      className="relative text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded p-1.5"
      onClick={() => setUnread(0)}
    >
      <NotificationsIcon size={18} />
      {unread > 0 && !isOnNotificationsPage && (
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-muted-terracotta rounded-full border-2 border-alabaster-cream"
        />
      )}
    </Link>
  );
}
