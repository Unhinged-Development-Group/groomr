"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StarRow } from "@/components/ui/StarRow";
import { PencilIcon, TrashIcon, CheckIcon, CloseIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { replyToReview, deleteGroomerReply } from "@/app/actions/groomer";
import type { Review as DBReview } from "@/app/actions/groomer";

interface ReviewItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  dog: string;
  rating: number;
  when: string;
  svc: string;
  text: string;
  responded: boolean;
  response?: string;
  createdAt: string;
}

const lsKey = (id: string) => `groomr_reviews_seen_${id}`;

function Avatar({
  src,
  name,
  size = 36,
  tone = "sage",
}: {
  src: string | null;
  name: string;
  size?: number;
  tone?: "sage" | "gold";
}) {
  const [failed, setFailed] = useState(false);
  const bg = tone === "gold" ? "bg-groomr-gold text-deep-slate" : "bg-sage-leaf text-white";

  if (src && !failed) {
    return (
      <div
        style={{ width: size, height: size, minWidth: size }}
        className="rounded-full overflow-hidden shrink-0"
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.38 }}
      className={cn("rounded-full flex items-center justify-center shrink-0 font-fredoka font-bold", bg)}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function ReviewsView({
  reviews: dbReviews,
  groomerProfileImageUrl,
  groomerName,
  groomerProfileId,
}: {
  reviews: DBReview[];
  groomerProfileImageUrl: string | null;
  groomerName: string;
  groomerProfileId: string;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Read last-seen timestamp from localStorage on mount, then update it
  useEffect(() => {
    const key = lsKey(groomerProfileId);
    const stored = localStorage.getItem(key);
    setLastSeen(stored);
    const timer = setTimeout(() => {
      localStorage.setItem(key, new Date().toISOString());
    }, 1500);
    return () => clearTimeout(timer);
  }, [groomerProfileId]);

  useEffect(() => {
    setReviews(
      dbReviews.map((r) => ({
        id: r.id,
        name: r.profiles?.full_name || "Owner",
        avatarUrl: r.profiles?.avatar_url || null,
        dog: r.appointments?.dogs?.name || "Dog",
        rating: r.rating,
        when: new Date(r.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        svc: r.appointments?.service_snapshot_name || "Service",
        text: r.body || "",
        responded: !!r.groomer_reply,
        response: r.groomer_reply || undefined,
        createdAt: r.created_at,
      }))
    );
  }, [dbReviews]);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  const dist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const isNew = (r: ReviewItem) => lastSeen !== null && r.createdAt > lastSeen;
  const newCount = reviews.filter(isNew).length;

  const FILTERS = [
    "All",
    ...(newCount > 0 ? [`New (${newCount})`] : []),
    "Unanswered",
    "Low",
    "5-star",
  ];

  const activeFilter = filter.startsWith("New (") ? "New" : filter;

  const visible = reviews.filter((r) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "New") return isNew(r);
    if (activeFilter === "Unanswered") return !r.responded;
    if (activeFilter === "Low") return r.rating <= 3;
    if (activeFilter === "5-star") return r.rating === 5;
    return true;
  });

  async function submitReply(id: string) {
    const txt = (drafts[id] ?? "").trim();
    if (!txt) return;
    setReviews((rs) =>
      rs.map((r) => (r.id === id ? { ...r, responded: true, response: txt } : r))
    );
    setDrafts((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
    await replyToReview(id, txt);
  }

  async function saveEdit(id: string) {
    const txt = (editing[id] ?? "").trim();
    if (!txt) return;
    setReviews((rs) =>
      rs.map((r) => (r.id === id ? { ...r, response: txt } : r))
    );
    setEditing((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
    await replyToReview(id, txt);
  }

  function startEdit(id: string, current: string) {
    setEditing((e) => ({ ...e, [id]: current }));
    setPendingDelete(null);
  }

  function cancelEdit(id: string) {
    setEditing((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
  }

  async function confirmDelete(id: string) {
    setReviews((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, responded: false, response: undefined } : r
      )
    );
    setPendingDelete(null);
    await deleteGroomerReply(id);
  }

  return (
    <section className="space-y-5">
      {/* Summary strip */}
      <div className="grid sm:grid-cols-[180px_1fr] gap-4">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 flex flex-col items-center justify-center text-center">
          <Eyebrow>Overall</Eyebrow>
          <p className="font-fredoka text-5xl text-deep-slate mt-1 leading-none">{avg}</p>
          <div className="flex justify-center mt-2">
            <StarRow rating={Number(avg)} size={16} />
          </div>
          <p className="text-xs text-pebble-grey font-bold mt-2">{reviews.length} reviews</p>
        </div>

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-2.5 justify-center flex flex-col">
          {dist.map((d) => {
            const pct = reviews.length ? (d.count / reviews.length) * 100 : 0;
            return (
              <div key={d.stars} className="grid grid-cols-[28px_1fr_24px] items-center gap-2">
                <span className="text-xs font-bold text-deep-slate">{d.stars}★</span>
                <div className="h-1.5 bg-pebble-grey/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-groomr-gold rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-pebble-grey text-right">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const fKey = f.startsWith("New (") ? "New" : f;
          const active = activeFilter === fKey;
          return (
            <button
              key={f}
              onClick={() => setFilter(fKey)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring border",
                active
                  ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                  : "bg-white text-deep-slate border-pebble-grey/20 hover:border-deep-slate/40"
              )}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        {visible.map((r) => {
          const reviewIsNew = isNew(r);
          const inEditMode = r.id in editing;

          return (
            <div
              key={r.id}
              className={cn(
                "bg-white border rounded-[20px] p-4 sm:p-5 transition-colors",
                reviewIsNew
                  ? "border-groomr-gold/50 ring-1 ring-groomr-gold/20"
                  : "border-pebble-grey/20"
              )}
            >
              {/* Review header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar src={r.avatarUrl} name={r.name} size={36} tone="sage" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                      <span className="font-bold text-deep-slate text-sm">{r.name}</span>
                      <span className="text-pebble-grey font-bold text-sm hidden xs:inline">·</span>
                      <span className="text-pebble-grey font-bold text-sm">{r.dog}</span>
                      {reviewIsNew && (
                        <span className="bg-groomr-gold text-deep-slate text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-tight">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-pebble-grey font-bold mt-0.5 truncate">
                      {r.svc} · {r.when}
                    </p>
                  </div>
                </div>
                <StarRow rating={r.rating} size={13} />
              </div>

              {/* Review body */}
              {r.text && (
                <p className="text-sm text-deep-slate mt-3 leading-relaxed">{r.text}</p>
              )}

              {/* Reply section */}
              {inEditMode ? (
                <div className="mt-3.5 space-y-2">
                  <textarea
                    value={editing[r.id]}
                    onChange={(e) =>
                      setEditing((ed) => ({ ...ed, [r.id]: e.target.value }))
                    }
                    className="field w-full resize-none text-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => cancelEdit(r.id)}
                      className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(r.id)}
                      disabled={!(editing[r.id] ?? "").trim()}
                      className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : r.responded ? (
                <div className="mt-3.5 bg-alabaster-cream border-l-2 border-sage-leaf rounded-r-xl p-3">
                  <div className="flex items-start gap-2.5">
                    <Avatar
                      src={groomerProfileImageUrl}
                      name={groomerName}
                      size={28}
                      tone="gold"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sage-leaf mb-1">
                        Your reply
                      </p>
                      <p className="text-sm text-deep-slate italic leading-relaxed">
                        {r.response}
                      </p>
                    </div>
                    {/* Edit / delete controls */}
                    <div className="flex items-center gap-0.5 shrink-0 self-start">
                      <button
                        onClick={() => startEdit(r.id, r.response ?? "")}
                        className="p-1.5 rounded-full hover:bg-pebble-grey/10 text-pebble-grey transition-colors focus-ring"
                        aria-label="Edit reply"
                      >
                        <PencilIcon size={14} />
                      </button>
                      {pendingDelete === r.id ? (
                        <>
                          <button
                            onClick={() => confirmDelete(r.id)}
                            className="p-1.5 rounded-full bg-muted-terracotta/10 hover:bg-muted-terracotta/20 text-muted-terracotta transition-colors focus-ring"
                            aria-label="Confirm delete"
                          >
                            <CheckIcon size={14} />
                          </button>
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="p-1.5 rounded-full hover:bg-pebble-grey/10 text-pebble-grey transition-colors focus-ring"
                            aria-label="Cancel delete"
                          >
                            <CloseIcon size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setPendingDelete(r.id)}
                          className="p-1.5 rounded-full hover:bg-muted-terracotta/10 text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring"
                          aria-label="Delete reply"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 flex gap-2">
                  <input
                    value={drafts[r.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitReply(r.id);
                      }
                    }}
                    className="field flex-1 text-sm min-w-0"
                    placeholder="Write a reply…"
                  />
                  <button
                    onClick={() => submitReply(r.id)}
                    disabled={!(drafts[r.id] ?? "").trim()}
                    className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-center text-sm text-pebble-grey font-bold py-10">
            No reviews in this filter.
          </p>
        )}
      </div>
    </section>
  );
}
