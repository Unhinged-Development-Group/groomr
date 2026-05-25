"use client";

import { useEffect, useState, useRef } from "react";
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
  const [url, setUrl] = useState("/dashboard");
  const [unread, setUnread] = useState(0);
  const profileIdRef = useRef<string>("");
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    let cancelled = false;

    getMessagesNavContext().then((ctx) => {
      if (cancelled) return;
      setUrl(ctx.url);
      setUnread(ctx.unreadCount);
      profileIdRef.current = ctx.profileId;

      // Clean up any previous channels
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];

      // Subscribe to each relevant appointment via broadcast (no RLS/auth needed)
      ctx.appointmentIds.forEach((apptId) => {
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
    });

    return () => {
      cancelled = true;
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, []);

  return (
    <Link
      href={url}
      aria-label="Messages"
      className="relative text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded p-1.5"
      onClick={() => setUnread(0)}
    >
      <MessagesIcon />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-muted-terracotta rounded-full border-2 border-alabaster-cream"
        />
      )}
    </Link>
  );
}
