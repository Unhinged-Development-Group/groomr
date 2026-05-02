"use client";

import { useState, useEffect } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StarRow } from "@/components/ui/StarRow";
import { cn } from "@/lib/utils";
import { replyToReview } from "@/app/actions/groomer";
import type { Review as DBReview } from "@/app/actions/groomer";

interface Review {
  id: string;
  name: string;
  dog: string;
  rating: number;
  when: string;
  svc: string;
  text: string;
  responded: boolean;
  response?: string;
}

export function ReviewsView({ reviews: dbReviews }: { reviews: DBReview[] }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  
  useEffect(() => {
    const formatted = dbReviews.map(r => ({
      id: r.id,
      name: r.appointments?.profiles ? `${r.appointments.profiles.first_name} ${r.appointments.profiles.last_name?.charAt(0)}.` : "Owner",
      dog: r.appointments?.dogs?.name || "Dog",
      rating: r.rating,
      when: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      svc: r.appointments?.service_snapshot_name || "Service",
      text: r.comment || "",
      responded: !!r.groomer_reply,
      response: r.groomer_reply || undefined
    }));
    setReviews(formatted);
  }, [dbReviews]);
  const [filter, setFilter] = useState("All");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const dist = [5,4,3,2,1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length }));

  const visible = reviews.filter(r =>
    filter === "All" ? true :
    filter === "Unanswered" ? !r.responded :
    filter === "Low" ? r.rating <= 3 :
    r.rating === 5
  );

  async function submit(id: string) {
    const txt = (drafts[id] ?? "").trim();
    if (!txt) return;
    
    // Optimistic update
    setReviews(rs => rs.map(r => r.id === id ? { ...r, responded: true, response: txt } : r));
    setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
    
    // Server action
    await replyToReview(id, txt);
  }

  return (
    <section className="space-y-5">
      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 text-center">
          <Eyebrow>Overall</Eyebrow>
          <p className="font-fredoka text-6xl text-deep-slate mt-1 leading-none">{avg}</p>
          <div className="flex justify-center mt-2">
            <StarRow rating={Number(avg)} size={16} />
          </div>
          <p className="text-xs text-pebble-grey font-bold mt-2">{reviews.length} reviews</p>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-2">
          {dist.map(d => {
            const pct = reviews.length ? (d.count / reviews.length) * 100 : 0;
            return (
              <div key={d.stars} className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                <span className="text-xs font-bold text-deep-slate">{d.stars}★</span>
                <div className="h-2 bg-pebble-grey/15 rounded-full overflow-hidden">
                  <div className="h-full bg-groomr-gold rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-pebble-grey text-right">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["All","Unanswered","Low","5-star"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring border", filter === f ? "bg-deep-slate text-alabaster-cream border-deep-slate" : "bg-white text-deep-slate border-pebble-grey/20 hover:border-deep-slate/40")}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map(r => (
          <div key={r.id} className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-deep-slate text-sm">{r.name} · <span className="text-pebble-grey font-bold">{r.dog}</span></p>
                  <p className="text-xs text-pebble-grey font-bold">{r.svc} · {r.when}</p>
                </div>
              </div>
              <StarRow rating={r.rating} size={14} />
            </div>
            <p className="text-sm text-deep-slate mt-3 leading-relaxed">{r.text}</p>
            {r.responded ? (
              <div className="mt-4 bg-alabaster-cream border-l-2 border-sage-leaf rounded-r-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sage-leaf mb-1">Your reply</p>
                <p className="text-sm text-deep-slate italic">{r.response}</p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input
                  value={drafts[r.id] ?? ""}
                  onChange={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
                  className="field flex-1"
                  placeholder="Write a reply…"
                />
                <button onClick={() => submit(r.id)} className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring">
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-center text-sm text-pebble-grey font-bold py-8">No reviews in this filter.</p>
        )}
      </div>
    </section>
  );
}
