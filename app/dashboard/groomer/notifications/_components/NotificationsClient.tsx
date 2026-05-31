"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GroomerNotification } from "@/app/actions/notifications";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import {
  CalendarIcon,
  NotificationsIcon,
  ReviewsIcon,
  FinancialsIcon,
  CloseIcon,
  PetsIcon,
} from "@/components/ui/GroomrIcons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NotifIcon({ type }: { type: GroomerNotification["type"] }) {
  const base = "w-10 h-10 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "new_appointment":
      return (
        <div className={`${base} bg-groomr-gold/20`}>
          <CalendarIcon size={18} className="text-deep-slate" />
        </div>
      );
    case "cancelled_appointment":
      return (
        <div className={`${base} bg-muted-terracotta/15`}>
          <CloseIcon size={18} className="text-muted-terracotta" />
        </div>
      );
    case "rescheduled_appointment":
      return (
        <div className={`${base} bg-pebble-grey/20`}>
          <CalendarIcon size={18} className="text-pebble-grey" />
        </div>
      );
    case "new_review":
      return (
        <div className={`${base} bg-groomr-gold/20`}>
          <ReviewsIcon size={18} className="text-deep-slate" />
        </div>
      );
    case "payout_processed":
      return (
        <div className={`${base} bg-sage-leaf/20`}>
          <FinancialsIcon size={18} className="text-sage-leaf" />
        </div>
      );
    case "new_client":
      return (
        <div className={`${base} bg-sage-leaf/20`}>
          <PetsIcon size={18} className="text-sage-leaf" />
        </div>
      );
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: GroomerNotification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-pebble-grey/10 flex items-center justify-center">
          <NotificationsIcon size={24} className="text-pebble-grey" />
        </div>
        <p className="font-fredoka text-xl text-deep-slate">All caught up</p>
        <p className="text-sm text-pebble-grey font-nunito">
          New bookings, reviews, and payouts will appear here.
        </p>
      </div>
    );
  }

  const groups: { label: string; items: GroomerNotification[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayItems = notifications.filter((n) => new Date(n.createdAt) >= today);
  const yesterdayItems = notifications.filter(
    (n) => new Date(n.createdAt) >= yesterday && new Date(n.createdAt) < today
  );
  const olderItems = notifications.filter((n) => new Date(n.createdAt) < yesterday);

  if (todayItems.length) groups.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems });
  if (olderItems.length) groups.push({ label: "Earlier", items: olderItems });

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-fredoka text-3xl text-deep-slate">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-muted-terracotta text-white font-bold text-xs">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-sm font-bold text-sage-leaf hover:text-sage-leaf/70 transition-colors focus-ring rounded"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.readAt && markRead(n.id)}
                className={[
                  "flex items-start gap-4 px-4 py-4 rounded-2xl transition-colors",
                  n.readAt
                    ? "bg-white"
                    : "bg-groomr-gold/8 cursor-pointer hover:bg-groomr-gold/14",
                ].join(" ")}
              >
                <NotifIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={[
                        "text-sm leading-snug",
                        n.readAt
                          ? "font-medium text-deep-slate/70"
                          : "font-bold text-deep-slate",
                      ].join(" ")}
                    >
                      {n.title}
                    </p>
                    <span className="text-[11px] text-pebble-grey shrink-0 mt-0.5">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-pebble-grey mt-1 leading-relaxed font-nunito">
                    {n.body}
                  </p>
                </div>
                {!n.readAt && (
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full bg-muted-terracotta mt-1.5 shrink-0"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
