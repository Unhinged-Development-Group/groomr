"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getMessagesNavContext } from "@/app/actions/messages";

function MessagesIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function MessagesNavButton() {
  const pathname = usePathname();
  const [url, setUrl] = useState("/dashboard");
  const [unread, setUnread] = useState(0);
  const profileIdRef = useRef<string>("");
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  // Whether we're currently on the messages page
  const isOnMessagesPage =
    pathname.includes("/messages");

  const refreshCount = useCallback(async () => {
    const ctx = await getMessagesNavContext();
    setUrl(ctx.url);
    profileIdRef.current = ctx.profileId;

    // Re-subscribe if appointment list changes
    const newIds = ctx.appointmentIds;
    const existingIds = new Set(
      channelsRef.current.map((ch) => (ch as { topic?: string }).topic ?? "")
    );
    const hasNewIds = newIds.some((id) => !existingIds.has(`realtime:messages:${id}`));

    if (hasNewIds || channelsRef.current.length === 0) {
      // Tear down old channels and re-subscribe
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];

      newIds.forEach((apptId) => {
        const ch = supabase
          .channel(`messages:${apptId}`)
          .on("broadcast", { event: "new_message" }, (payload) => {
            const msg = payload.payload as { senderId: string };
            if (msg.senderId !== profileIdRef.current) {
              setUnread((c) => c + 1);
            }
          })
          .subscribe();
        channelsRef.current.push(ch);
      });
    }

    // Always sync the DB count so missed broadcasts are caught
    setUnread((prev) => {
      // If user is on the messages page, trust that they're reading — keep low count
      if (isOnMessagesPage) return 0;
      // Otherwise take whichever is higher: real-time increments vs DB truth
      return Math.max(prev, ctx.unreadCount);
    });
  }, [isOnMessagesPage]);

  // Initial load
  useEffect(() => {
    refreshCount();

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 30 s as a fallback for missed broadcasts
  useEffect(() => {
    const id = setInterval(refreshCount, 30_000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Clear dot when user navigates to messages page
  useEffect(() => {
    if (isOnMessagesPage) setUnread(0);
  }, [isOnMessagesPage]);

  return (
    <Link
      href={url}
      aria-label="Messages"
      className="relative text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded p-1.5"
      onClick={() => setUnread(0)}
    >
      <MessagesIcon />
      {unread > 0 && !isOnMessagesPage && (
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-muted-terracotta rounded-full border-2 border-alabaster-cream"
        />
      )}
    </Link>
  );
}
