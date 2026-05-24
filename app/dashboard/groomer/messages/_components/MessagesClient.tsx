"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import {
  getMessagesForAppointment,
  sendMessage,
  markThreadRead,
  type MessageThread,
  type MessageRow,
  type BookingForMessaging,
} from "@/app/actions/messages";
import { PlusIcon, CloseIcon } from "@/components/ui/GroomrIcons";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function avatarLetter(name: string): string {
  return (name?.[0] ?? "?").toUpperCase();
}

interface Props {
  initialThreads: MessageThread[];
  initialBookings: BookingForMessaging[];
  currentUserId: string;
}

export function MessagesClient({ initialThreads, initialBookings }: Props) {
  const [threads, setThreads] = useState<MessageThread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(
    initialThreads[0]?.appointmentId ?? null
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [, startSendTransition] = useTransition();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.appointmentId === activeId) ?? null;

  const existingIds = new Set(threads.map((t) => t.appointmentId));
  const filteredBookings = initialBookings.filter((b) => {
    const q = bookingSearch.toLowerCase();
    return (
      b.ownerName.toLowerCase().includes(q) ||
      (b.dogName ?? "").toLowerCase().includes(q)
    );
  });

  // Load messages when thread changes
  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    getMessagesForAppointment(activeId).then((msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
      markThreadRead(activeId);
      setThreads((prev) =>
        prev.map((t) => (t.appointmentId === activeId ? { ...t, unreadCount: 0 } : t))
      );
    });
  }, [activeId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Supabase Realtime subscription for the active thread
  useEffect(() => {
    if (!activeId) return;

    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `appointment_id=eq.${activeId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            appointment_id: string;
            sender_id: string;
            body: string;
            is_system: boolean;
            read_at: string | null;
            created_at: string;
          };
          const newMsg: MessageRow = {
            id: m.id,
            appointmentId: m.appointment_id,
            senderId: m.sender_id,
            body: m.body,
            isSystem: m.is_system,
            readAt: m.read_at,
            createdAt: m.created_at,
          };
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setThreads((prev) =>
            prev.map((t) =>
              t.appointmentId === activeId
                ? { ...t, lastMessage: m.body, lastMessageAt: m.created_at }
                : t
            )
          );
          markThreadRead(activeId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  function handleSelectThread(appointmentId: string) {
    setActiveId(appointmentId);
    setDraft("");
    setNewChatOpen(false);
    setBookingSearch("");
  }

  function handleStartChat(booking: BookingForMessaging) {
    // If a thread already exists, just switch to it
    if (existingIds.has(booking.appointmentId)) {
      handleSelectThread(booking.appointmentId);
      return;
    }
    // Otherwise add a temporary thread stub and open it
    const stub: MessageThread = {
      appointmentId:  booking.appointmentId,
      scheduledAt:    booking.scheduledAt,
      ownerName:      booking.ownerName,
      ownerProfileId: booking.ownerProfileId,
      dogName:        booking.dogName,
      lastMessage:    null,
      lastMessageAt:  null,
      unreadCount:    0,
    };
    setThreads((prev) => [stub, ...prev]);
    handleSelectThread(booking.appointmentId);
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");

    const tempId = `temp-${Date.now()}`;
    const tempMsg: MessageRow = {
      id: tempId,
      appointmentId: activeId,
      senderId: "__me__",
      body: text,
      isSystem: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    setThreads((prev) =>
      prev.map((t) =>
        t.appointmentId === activeId
          ? { ...t, lastMessage: text, lastMessageAt: new Date().toISOString() }
          : t
      )
    );

    startSendTransition(async () => {
      const result = await sendMessage(activeId, text);
      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert(`Failed to send: ${result.error}`);
      } else if (result.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? result.message! : m))
        );
      }
    });
  }

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[560px]">
      {/* Thread list */}
      <aside className="border-r border-pebble-grey/15 flex flex-col max-h-[640px]">
        {/* List header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-pebble-grey/10 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">Conversations</p>
          <button
            onClick={() => { setNewChatOpen((o) => !o); setBookingSearch(""); }}
            className="w-7 h-7 rounded-full bg-deep-slate text-alabaster-cream flex items-center justify-center hover:bg-deep-slate/80 transition-colors focus-ring"
            aria-label="New conversation"
            title="Start a new conversation"
          >
            {newChatOpen ? <CloseIcon size={12} /> : <PlusIcon size={12} />}
          </button>
        </div>

        {/* New chat picker */}
        {newChatOpen && (
          <div className="border-b border-pebble-grey/10 p-3 bg-alabaster-cream/50 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey mb-2">Start a conversation with…</p>
            <input
              className="field text-sm py-1.5 mb-2"
              placeholder="Search by owner or dog name"
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
            />
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredBookings.length === 0 && (
                <p className="text-xs text-pebble-grey py-2 text-center">No bookings found</p>
              )}
              {filteredBookings.map((b) => (
                <button
                  key={b.appointmentId}
                  onClick={() => handleStartChat(b)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-alabaster-cream transition-colors flex items-center gap-3 focus-ring"
                >
                  <div className="w-8 h-8 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center shrink-0 text-sm">
                    {avatarLetter(b.ownerName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-deep-slate truncate">{b.ownerName}</p>
                    {b.dogName && (
                      <p className="text-[10px] text-pebble-grey font-bold truncate">{b.dogName}&rsquo;s appointment</p>
                    )}
                  </div>
                  {existingIds.has(b.appointmentId) && (
                    <span className="ml-auto text-[9px] font-bold text-sage-leaf bg-sage-leaf/10 px-2 py-0.5 rounded-full shrink-0">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && !newChatOpen && (
            <div className="p-8 text-center text-pebble-grey text-sm font-bold">
              No messages yet.<br />
              <span className="text-xs font-normal opacity-70">Tap + to start a conversation with a client.</span>
            </div>
          )}
          {threads.map((t) => (
            <button
              key={t.appointmentId}
              onClick={() => handleSelectThread(t.appointmentId)}
              className={`w-full text-left p-4 flex items-start gap-3 border-b border-pebble-grey/10 transition-colors focus-ring ${activeId === t.appointmentId ? "bg-alabaster-cream" : "hover:bg-alabaster-cream/60"}`}
            >
              <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center shrink-0 text-lg">
                {avatarLetter(t.ownerName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold text-sm text-deep-slate truncate">{t.ownerName}</p>
                  <span className="text-[10px] text-pebble-grey font-bold shrink-0">
                    {t.lastMessageAt ? formatRelativeTime(t.lastMessageAt) : ""}
                  </span>
                </div>
                {t.dogName && (
                  <p className="text-xs text-pebble-grey font-bold truncate">{t.dogName}&rsquo;s appointment</p>
                )}
                <p className={`text-xs mt-1 truncate ${t.unreadCount > 0 ? "text-deep-slate font-bold" : "text-pebble-grey"}`}>
                  {t.lastMessage ?? "No messages yet — say hello!"}
                </p>
              </div>
              {t.unreadCount > 0 && (
                <span className="bg-muted-terracotta text-alabaster-cream text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                  {t.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Active conversation */}
      <section className="flex flex-col">
        {!activeThread && (
          <div className="flex-1 flex items-center justify-center text-pebble-grey text-sm font-bold p-8 text-center">
            Select a conversation, or tap <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-deep-slate text-alabaster-cream mx-1"><PlusIcon size={10} /></span> to start one.
          </div>
        )}
        {activeThread && (
          <>
            <div className="px-5 py-4 border-b border-pebble-grey/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center text-lg">
                {avatarLetter(activeThread.ownerName)}
              </div>
              <div className="min-w-0">
                <p className="font-fredoka text-lg text-deep-slate leading-tight">{activeThread.ownerName}</p>
                {activeThread.dogName && (
                  <p className="text-xs text-pebble-grey font-bold">{activeThread.dogName}&rsquo;s appointment</p>
                )}
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 p-5 space-y-3 overflow-y-auto"
              style={{ maxHeight: 440 }}
            >
              {loadingMessages && (
                <div className="text-center text-pebble-grey text-xs py-4">Loading…</div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-center text-pebble-grey text-xs py-8">
                  No messages yet. Say hello!
                </div>
              )}
              {messages.map((m) => {
                const isMe = m.senderId !== activeThread.ownerProfileId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? "bg-deep-slate text-alabaster-cream"
                          : "bg-alabaster-cream text-deep-slate border border-pebble-grey/15"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-pebble-grey/15 p-4 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Write a message…"
                className="field flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
