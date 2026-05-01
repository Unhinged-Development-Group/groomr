"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { StarRow } from "@/components/ui/StarRow";
import { supabase } from "@/lib/supabase";
import type { GroomerResult } from "@/types/search";
import { MapPin } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_pence: number;
  deposit_pence: number | null;
  applicable_sizes: string[] | null;
  sort_order: number | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  profiles: { full_name: string | null }[] | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SIZE_LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  giant: "Giant",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

interface GroomerProfileModalProps {
  groomer: GroomerResult;
  onClose: () => void;
}

export function GroomerProfileModal({ groomer, onClose }: GroomerProfileModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [svcRes, availRes, revRes] = await Promise.all([
        supabase
          .from("services")
          .select("id, name, description, duration_minutes, price_pence, deposit_pence, applicable_sizes, sort_order")
          .eq("groomer_profile_id", groomer.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true, nullsFirst: false }),
        supabase
          .from("availability")
          .select("day_of_week, start_time, end_time")
          .eq("groomer_profile_id", groomer.id)
          .eq("is_active", true)
          .order("day_of_week", { ascending: true }),
        supabase
          .from("reviews")
          .select("id, rating, body, created_at, profiles(full_name)")
          .eq("groomer_profile_id", groomer.id)
          .eq("is_visible", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setServices((svcRes.data ?? []) as Service[]);
      setAvailability((availRes.data ?? []) as AvailabilityRow[]);
      setReviews((revRes.data ?? []) as Review[]);
      setLoading(false);
    }
    load();
  }, [groomer.id]);

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 py-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 modal-backdrop cursor-pointer"
        />

        {/* Sheet */}
        <div className="relative bg-alabaster-cream w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-modal z-10 border border-pebble-grey/20 flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 z-20 text-deep-slate hover:text-muted-terracotta transition-colors focus-ring rounded-full p-2 bg-white/90 backdrop-blur-sm shadow-subtle border border-pebble-grey/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
            {/* Banner */}
            <div className="h-48 md:h-64 bg-sage-leaf/30 relative">
              <Image
                src={groomer.image}
                alt={groomer.name}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
              {/* Avatar */}
              <div className="absolute -bottom-16 left-8 md:left-12">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-[20px] border-4 border-alabaster-cream overflow-hidden shadow-subtle bg-white">
                  <Image
                    src={groomer.image}
                    alt={groomer.name}
                    width={144}
                    height={144}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>

            <div className="pt-20 pb-12 px-8 md:px-12 space-y-10">
              {/* Title + Book Now */}
              <div className="grid lg:grid-cols-3 gap-6 lg:gap-10 items-end">
                <div className="lg:col-span-2 space-y-2">
                  <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate leading-tight">
                    {groomer.name}
                  </h2>
                  {groomer.tagline && (
                    <p className="text-xl text-sage-leaf font-bold">{groomer.tagline}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-pebble-grey">
                    {groomer.rating > 0 && (
                      <StarRow rating={groomer.rating} count={groomer.reviewCount} />
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {groomer.location}
                      {groomer.distance !== undefined && ` · ${groomer.distance} miles`}
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <button
                    onClick={() => setToast("Booking coming soon! We'll let you know when it's live.")}
                    className="w-full btn-primary font-nunito font-bold py-4 rounded-full text-lg shadow-subtle focus-ring"
                  >
                    Book Now
                  </button>
                </div>
              </div>

              {/* Services + Hours/About */}
              <div className="grid lg:grid-cols-3 gap-10">
                {/* Services */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4">
                    Our Services
                  </h3>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-pebble-grey/20 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : services.length === 0 ? (
                    <p className="text-pebble-grey text-sm">No services listed yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {services.map((svc) => (
                        <ServiceCard key={svc.id} service={svc} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Hours + About */}
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-[20px] border border-pebble-grey/10 shadow-subtle space-y-4">
                    <h4 className="font-fredoka text-xl text-deep-slate">Opening Hours</h4>
                    {loading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-4 bg-pebble-grey/20 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : availability.length === 0 ? (
                      <p className="text-pebble-grey text-sm">Hours not listed yet.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {availability.map((a) => (
                          <li
                            key={a.day_of_week}
                            className="flex justify-between text-deep-slate"
                          >
                            <span className="font-bold">{DAY_NAMES[a.day_of_week]}</span>
                            <span className="text-pebble-grey">
                              {formatTime(a.start_time)} – {formatTime(a.end_time)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {groomer.tagline && (
                    <div className="space-y-3">
                      <h4 className="font-fredoka text-xl text-deep-slate">About Us</h4>
                      <p className="text-deep-slate/80 leading-relaxed text-sm">
                        {groomer.tagline}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              {!loading && reviews.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-4">
                    Recent Reviews
                  </h3>
                  <div className="grid md:grid-cols-2 gap-5">
                    {reviews.map((r) => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="bg-white rounded-xl border border-pebble-grey/10 p-5 flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-fredoka text-lg text-deep-slate">{service.name}</p>
        {service.description && (
          <p className="text-xs text-pebble-grey mt-1 leading-relaxed">{service.description}</p>
        )}
        {service.applicable_sizes && service.applicable_sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {service.applicable_sizes.map((size) => (
              <span
                key={size}
                className="text-xs font-bold bg-sage-leaf/10 text-sage-leaf px-2.5 py-0.5 rounded-full border border-sage-leaf/20"
              >
                {SIZE_LABELS[size] ?? size}
              </span>
            ))}
          </div>
        )}
        {service.duration_minutes && (
          <p className="text-xs text-pebble-grey mt-2">{service.duration_minutes} min</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="font-fredoka text-2xl text-deep-slate">
          £{(service.price_pence / 100).toFixed(0)}
        </span>
        {service.deposit_pence && service.deposit_pence > 0 && (
          <p className="text-xs text-pebble-grey mt-0.5">
            £{(service.deposit_pence / 100).toFixed(0)} deposit
          </p>
        )}
      </div>
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-sm text-deep-slate">
            {review.profiles?.[0]?.full_name ?? "Anonymous"}
          </p>
          <p className="text-xs text-pebble-grey">{date}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className="w-3.5 h-3.5"
              fill={i < review.rating ? "#eae45c" : "#ddd"}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      {review.body && (
        <p className="text-sm text-deep-slate/80 leading-relaxed">{review.body}</p>
      )}
    </div>
  );
}
