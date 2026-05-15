"use client";

import { useState } from "react";
import { StarRow } from "@/components/ui/StarRow";

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  groomer_reply: string | null;
  profiles: { full_name: string | null }[] | null;
}

interface ReviewsSectionProps {
  reviews: Review[];
}

const PAGE_SIZE = 6;

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-[20px] border border-pebble-grey/10">
        <div className="w-12 h-12 bg-groomr-gold/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-deep-slate/40" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <p className="font-bold text-deep-slate text-sm">No reviews yet</p>
        <p className="text-pebble-grey text-xs mt-1">Be the first to book and leave a review</p>
      </div>
    );
  }

  const shown = reviews.slice(0, visible);
  const hasMore = visible < reviews.length;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        {shown.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="btn-secondary font-nunito font-bold py-2.5 px-6 rounded-full text-sm focus-ring"
          >
            Load more reviews
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
  return (
    <div className="bg-white rounded-xl border border-pebble-grey/10 p-5 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-bold text-sm text-deep-slate">
            {review.profiles?.[0]?.full_name ?? "Dog owner"}
          </p>
          <p className="text-xs text-pebble-grey">{date}</p>
        </div>
        <StarRow rating={review.rating} size={13} />
      </div>
      {review.body && (
        <p className="text-sm text-deep-slate/80 leading-relaxed">{review.body}</p>
      )}
      {review.groomer_reply && (
        <div className="pl-4 border-l-2 border-sage-leaf/30 space-y-1 pt-1">
          <p className="text-xs font-bold text-sage-leaf">Groomer reply</p>
          <p className="text-xs text-deep-slate/70 leading-relaxed">{review.groomer_reply}</p>
        </div>
      )}
    </div>
  );
}
