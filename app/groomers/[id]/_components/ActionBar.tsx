"use client";

import { useState, useTransition, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/components/ui/GroomrIcons";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { addFavourite, removeFavourite } from "@/app/actions/favourites";
import { sendContactInquiry } from "@/app/actions/contact";
import { BookingFlow } from "@/app/search/_components/BookingFlow";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_pence: number;
  deposit_pence: number | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ActionBarProps {
  groomerId: string;
  groomerName: string;
  initialSaved: boolean;
  services: Service[];
  availability: AvailabilityRow[];
  depositPolicy: { type: "none" | "percentage" | "full"; percentage: number | null };
}

export function ActionBar({
  groomerId,
  groomerName,
  initialSaved,
  services,
  availability,
  depositPolicy,
}: ActionBarProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Auto-open booking modal if returning from sign-in during a booking flow
  useEffect(() => {
    const key = `groomr_booking_resume_${groomerId}`;
    if (sessionStorage.getItem(key)) {
      setBookingOpen(true);
    }
  }, [groomerId]);
  const [contactOpen, setContactOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function toggleFavourite() {
    if (busy) return;
    setBusy(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    const result = await (wasSaved ? removeFavourite(groomerId) : addFavourite(groomerId));
    if (!result.ok) {
      setSaved(wasSaved);
      setToast("Please sign in to save groomers");
    }
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={toggleFavourite}
          disabled={busy}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border transition-all focus-ring",
            saved
              ? "bg-muted-terracotta/10 border-muted-terracotta text-muted-terracotta"
              : "bg-white border-pebble-grey/30 text-pebble-grey hover:border-muted-terracotta hover:text-muted-terracotta"
          )}
        >
          <HeartIcon size={18} filled={saved} />
        </button>

        <button
          onClick={() => {
            if (isLoaded && isSignedIn) {
              router.push(`/dashboard/owner/messages?groomer=${groomerId}`);
            } else {
              setContactOpen(true);
            }
          }}
          className="btn-secondary font-nunito font-bold py-2.5 px-5 rounded-full text-sm focus-ring"
        >
          Contact
        </button>

        <button
          onClick={() => setBookingOpen(true)}
          className="btn-primary font-nunito font-bold py-2.5 px-6 rounded-full text-sm shadow-subtle focus-ring"
        >
          Book Now
        </button>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {bookingOpen && (
        <BookingFlow
          groomerProfileId={groomerId}
          groomerName={groomerName}
          services={services}
          availability={availability}
          depositPolicy={depositPolicy}
          onClose={() => setBookingOpen(false)}
        />
      )}

      {contactOpen && isLoaded && (
        <ContactModal
          groomerName={groomerName}
          groomerId={groomerId}
          isSignedIn={!!isSignedIn}
          prefillName={user?.fullName ?? ""}
          prefillEmail={user?.primaryEmailAddress?.emailAddress ?? ""}
          onClose={() => setContactOpen(false)}
          onSent={() => setToast("Message sent! We'll let the groomer know.")}
        />
      )}
    </>
  );
}

// ─── ContactModal ─────────────────────────────────────────────────────────────

interface ContactModalProps {
  groomerName: string;
  groomerId: string;
  isSignedIn: boolean;
  prefillName: string;
  prefillEmail: string;
  onClose: () => void;
  onSent: () => void;
}

function ContactModal({
  groomerName,
  groomerId,
  isSignedIn,
  prefillName,
  prefillEmail,
  onClose,
  onSent,
}: ContactModalProps) {
  const { openSignIn } = useClerk();
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendContactInquiry(groomerName, groomerId, name, email, message);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
      } else {
        setSent(true);
        onSent();
        setTimeout(onClose, 1800);
      }
    });
  }

  return (
    <Modal open onClose={onClose} size="sm">
      {sent ? (
        <div className="text-center py-6 space-y-2">
          <p className="font-fredoka text-2xl text-deep-slate">Message sent!</p>
          <p className="text-pebble-grey text-sm font-nunito">
            We&apos;ve passed your enquiry to {groomerName}. They&apos;ll be in touch shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="font-fredoka text-2xl text-deep-slate">Contact {groomerName}</h2>
            {!isSignedIn && (
              <p className="text-pebble-grey text-sm mt-1 font-nunito">
                Already have an account?{" "}
                <button onClick={() => openSignIn()} className="text-link font-bold">
                  Sign in
                </button>{" "}
                to message groomers.
              </p>
            )}
          </div>

          {!isSignedIn && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-deep-slate">Your name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field w-full"
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-deep-slate">Email address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field w-full"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          )}

          {isSignedIn && (
            <p className="text-sm text-pebble-grey font-nunito">
              Sending as <span className="font-bold text-deep-slate">{prefillName || prefillEmail}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-deep-slate">Message</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="field w-full resize-none"
              placeholder={`Hi ${groomerName}, I'd love to find out more…`}
            />
          </div>

          {error && <p className="text-sm text-muted-terracotta font-bold">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full font-nunito font-bold py-2.5 rounded-full text-sm disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </Modal>
  );
}
