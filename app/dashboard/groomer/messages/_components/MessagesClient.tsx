"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getMessagesForAppointment,
  sendMessage,
  markThreadRead,
  deleteThread,
  type MessageThread,
  type MessageRow,
  type BookingForMessaging,
} from "@/app/actions/messages";
import { PlusIcon, CloseIcon, TrashIcon } from "@/components/ui/GroomrIcons";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d >= todayStart) return time;
  if (d >= weekStart) return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}`;
}

function avatarLetter(name: string): string {
  return (name?.[0] ?? "?").toUpperCase();
}

function Avatar({
  url,
  name,
  className = "",
  bg = "bg-sage-leaf",
  fg = "text-white",
}: {
  url?: string | null;
  name: string;
  className?: string;
  bg?: string;
  fg?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full ${bg} ${fg} font-fredoka flex items-center justify-center shrink-0 text-lg ${className}`}
    >
      {avatarLetter(name)}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-3">
      <span className="w-1.5 h-1.5 bg-pebble-grey rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-pebble-grey rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-pebble-grey rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

interface Props {
  initialThreads: MessageThread[];
  initialBookings: BookingForMessaging[];
  profileId: string;
}

export function MessagesClient({ initialThreads, initialBookings, profileId }: Props) {
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
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messageChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeIdRef = useRef<string | null>(activeId);

  // Owner info modal
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);
  // Delete confirm
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

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
    setDeleteConfirming(false);
    setShowOwnerInfo(false);
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

  // Broadcast subscription for active thread
  useEffect(() => {
    if (!activeId) return;

    const ch = supabase
      .channel(`messages:${activeId}`)
      .on("broadcast", { event: "new_message" }, (payload) => {
        const newMsg = payload.payload as MessageRow;
        if (newMsg.senderId === profileId) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setThreads((prev) =>
          prev.map((t) =>
            t.appointmentId === activeId
              ? { ...t, lastMessage: newMsg.body, lastMessageAt: newMsg.createdAt }
              : t
          )
        );
        markThreadRead(activeId);
      })
      .subscribe();

    messageChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      messageChannelRef.current = null;
    };
  }, [activeId, profileId]);

  // Typing indicator
  useEffect(() => {
    if (!activeId) return;
    setIsOtherTyping(false);

    const ch = supabase
      .channel(`typing:${activeId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        const { senderId, isTyping } = payload.payload as { senderId: string; isTyping: boolean };
        if (senderId === profileId) return;
        setIsOtherTyping(isTyping);
        if (isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsOtherTyping(false);
    };
  }, [activeId, profileId]);

  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      typingChannelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { senderId: profileId, isTyping },
      });
    },
    [profileId],
  );

  // Background broadcast subscriptions
  useEffect(() => {
    if (!profileId) return;

    const channels = threads.map((t) =>
      supabase
        .channel(`groomer-bg:${t.appointmentId}`)
        .on("broadcast", { event: "new_message" }, (payload) => {
          const msg = payload.payload as MessageRow;
          if (msg.senderId === profileId) return;
          if (msg.appointmentId === activeIdRef.current) return;

          setThreads((prev) =>
            prev.map((th) =>
              th.appointmentId === msg.appointmentId
                ? {
                    ...th,
                    lastMessage: msg.body,
                    lastMessageAt: msg.createdAt,
                    unreadCount: th.unreadCount + 1,
                  }
                : th,
            ),
          );
        })
        .subscribe(),
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, threads.map((t) => t.appointmentId).join(",")]);

  function handleSelectThread(appointmentId: string) {
    setActiveId(appointmentId);
    setDraft("");
    setNewChatOpen(false);
    setBookingSearch("");
  }

  function handleStartChat(booking: BookingForMessaging) {
    if (existingIds.has(booking.appointmentId)) {
      handleSelectThread(booking.appointmentId);
      return;
    }
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

  async function handleDeleteThread() {
    if (!activeId) return;
    setIsDeleting(true);
    const result = await deleteThread(activeId);
    setIsDeleting(false);
    if (result.error) return;
    setThreads((prev) => prev.filter((t) => t.appointmentId !== activeId));
    setMessages([]);
    setDeleteConfirming(false);
    const remaining = threads.filter((t) => t.appointmentId !== activeId);
    setActiveId(remaining[0]?.appointmentId ?? null);
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    broadcastTyping(false);

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
        const confirmed = result.message;
        setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmed : m)));
        messageChannelRef.current?.send({
          type: "broadcast",
          event: "new_message",
          payload: confirmed,
        });
      }
    });
  }

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[560px]">
      {/* Thread list */}
      <aside className="border-r border-pebble-grey/15 flex flex-col max-h-[640px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-pebble-grey/10 shrink-0">
          <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">Conversations</p>
          <button
            onClick={() => { setNewChatOpen((o) => !o); setBookingSearch(""); }}
            className="w-7 h-7 rounded-full bg-groomr-gold text-deep-slate flex items-center justify-center hover:bg-groomr-gold/80 transition-colors focus-ring"
            aria-label="New conversation"
          >
            {newChatOpen ? <CloseIcon size={12} /> : <PlusIcon size={12} />}
          </button>
        </div>

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
                      <p className="text-[10px] text-pebble-grey font-bold truncate">{b.dogName}</p>
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
              <Avatar url={t.ownerAvatarUrl} name={t.ownerName} className="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold text-sm text-deep-slate truncate">{t.ownerName}</p>
                  <span className="text-[10px] text-pebble-grey font-bold shrink-0">
                    {t.lastMessageAt ? formatRelativeTime(t.lastMessageAt) : ""}
                  </span>
                </div>
                {t.dogName && (
                  <p className="text-xs text-pebble-grey font-bold truncate">{t.dogName}</p>
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
            Select a conversation, or tap <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-groomr-gold text-deep-slate mx-1"><PlusIcon size={10} /></span> to start one.
          </div>
        )}
        {activeThread && (
          <>
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-pebble-grey/15 flex items-center gap-3">
              <Avatar url={activeThread.ownerAvatarUrl} name={activeThread.ownerName} className="w-10 h-10" />
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => setShowOwnerInfo(true)}
                  className="font-fredoka text-lg text-deep-slate leading-tight hover:text-sage-leaf transition-colors text-left"
                >
                  {activeThread.ownerName}
                </button>
                {activeThread.dogName && (
                  <p className="text-xs text-pebble-grey font-bold">{activeThread.dogName}</p>
                )}
              </div>
              {/* Delete */}
              {deleteConfirming ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-pebble-grey font-bold">Delete conversation?</span>
                  <button
                    onClick={handleDeleteThread}
                    disabled={isDeleting}
                    className="text-xs font-bold text-muted-terracotta hover:underline focus-ring disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting…" : "Yes"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirming(false)}
                    className="text-xs font-bold text-pebble-grey hover:underline focus-ring"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirming(true)}
                  className="text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded p-1 shrink-0"
                  aria-label="Delete conversation"
                >
                  <TrashIcon size={16} />
                </button>
              )}
            </div>

            {/* Messages */}
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
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? "bg-deep-slate text-alabaster-cream"
                          : "bg-alabaster-cream text-deep-slate border border-pebble-grey/15"
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="text-[10px] text-pebble-grey mt-1 px-1">
                      {formatMessageTime(m.createdAt)}
                    </span>
                  </div>
                );
              })}
              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl px-4 py-3">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-pebble-grey/15 p-4 flex gap-2">
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  broadcastTyping(e.target.value.length > 0);
                }}
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

      {/* Owner info modal */}
      {showOwnerInfo && activeThread && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={() => setShowOwnerInfo(false)}
        >
          <div
            className="bg-white rounded-[20px] shadow-modal p-6 w-full max-w-sm mx-4 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-fredoka text-xl text-deep-slate">Client details</h2>
              <button onClick={() => setShowOwnerInfo(false)} className="text-pebble-grey hover:text-deep-slate focus-ring rounded p-1">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Avatar url={activeThread.ownerAvatarUrl} name={activeThread.ownerName} className="w-16 h-16 text-2xl" />
              <div>
                <p className="font-fredoka text-lg text-deep-slate">{activeThread.ownerName}</p>
                {activeThread.dogName && (
                  <p className="text-sm text-pebble-grey font-bold">{activeThread.dogName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm font-nunito">
              {activeThread.ownerPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-pebble-grey w-16 shrink-0">Phone</span>
                  <a href={`tel:${activeThread.ownerPhone}`} className="text-deep-slate text-link">{activeThread.ownerPhone}</a>
                </div>
              )}
              {activeThread.ownerEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-pebble-grey w-16 shrink-0">Email</span>
                  <a href={`mailto:${activeThread.ownerEmail}`} className="text-deep-slate text-link truncate">{activeThread.ownerEmail}</a>
                </div>
              )}
              {!activeThread.ownerPhone && !activeThread.ownerEmail && (
                <p className="text-pebble-grey">No contact details on file.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
