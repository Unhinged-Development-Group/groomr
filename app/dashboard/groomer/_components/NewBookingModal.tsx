"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/GroomrIcons";
import { createManualAppointment } from "@/app/actions/groomer";
import type { ServiceRow } from "@/types/groomer-dashboard";

const DOG_BREEDS = [
  "Labrador Retriever", "Golden Retriever", "French Bulldog", "German Shepherd",
  "Bulldog", "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier", "Dachshund",
  "Boxer", "Siberian Husky", "Shih Tzu", "Cavalier King Charles Spaniel",
  "Border Collie", "Cocker Spaniel", "Springer Spaniel", "Border Terrier",
  "Staffordshire Bull Terrier", "Jack Russell Terrier", "Bichon Frise",
  "Maltese", "Pug", "Chihuahua", "Whippet", "Greyhound", "Lurcher",
  "Weimaraner", "Vizsla", "Dalmatian", "Great Dane", "Dobermann",
  "Miniature Schnauzer", "West Highland Terrier", "Scottish Terrier",
  "Lhasa Apso", "Shiba Inu", "Samoyed", "Alaskan Malamute", "Chow Chow",
  "Shar Pei", "Basenji", "Rhodesian Ridgeback", "Bernese Mountain Dog",
  "Mixed breed / Crossbreed", "Other",
];

export interface ExistingClient {
  ownerId: string;
  name: string;
  dogs: { dogId: string | null; name: string; breed: string | null }[];
}

interface Props {
  services: ServiceRow[];
  existingClients: ExistingClient[];
  onClose: () => void;
}

type Step = "pick" | "existing" | "new";

function ClientAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  return (
    <div className={`${dims} rounded-full bg-sage-leaf/20 flex items-center justify-center font-fredoka text-deep-slate shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function NewBookingModal({ services, existingClients, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const bookableServices = services.filter((s): s is typeof s & { id: string } => s.id !== null);

  const [step, setStep] = useState<Step>("pick");
  const [selectedClient, setSelectedClient] = useState<ExistingClient | null>(null);
  const [selectedDogIdx, setSelectedDogIdx] = useState(0);

  // Shared booking fields
  const [serviceId, setServiceId] = useState(bookableServices[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // New client fields
  const [clientName, setClientName] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [doneClientName, setDoneClientName] = useState("");

  const selectedService = bookableServices.find((s) => s.id === serviceId);

  function pickClient(client: ExistingClient) {
    setSelectedClient(client);
    setSelectedDogIdx(0);
    setStep("existing");
  }

  function goNew() {
    setSelectedClient(null);
    setStep("new");
  }

  function goBack() {
    setStep("pick");
    setError(null);
  }

  async function submitExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient || !serviceId || !date || !time) return;
    const dog = selectedClient.dogs[selectedDogIdx];
    setError(null);
    startTransition(async () => {
      const result = await createManualAppointment({
        serviceId,
        clientName: selectedClient.name,
        dogName: dog?.name ?? "",
        scheduledDate: date,
        scheduledTime: time,
        existingOwnerId: selectedClient.ownerId,
        existingDogId: dog?.dogId ?? undefined,
      });
      if ("error" in result) { setError(result.error); return; }
      setDoneClientName(selectedClient.name);
      setDone(true);
      router.refresh();
    });
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !clientName.trim() || !dogName.trim() || !date || !time) return;
    setError(null);
    startTransition(async () => {
      const result = await createManualAppointment({
        serviceId,
        clientName: clientName.trim(),
        dogName: dogName.trim(),
        dogBreed: dogBreed || undefined,
        scheduledDate: date,
        scheduledTime: time,
        notes: notes.trim() || undefined,
      });
      if ("error" in result) { setError(result.error); return; }
      setDoneClientName(clientName.trim());
      setDone(true);
      router.refresh();
    });
  }

  const heading =
    step === "pick" ? "New booking" :
    step === "existing" ? selectedClient?.name ?? "Booking" :
    "New client";

  const subheading =
    step === "pick" ? "Select a client" :
    step === "existing" ? "Fill in the details" :
    "Enter their details";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-deep-slate/60 backdrop-blur-sm" />

      <div className="relative bg-alabaster-cream w-full max-w-lg rounded-[28px] shadow-modal border border-pebble-grey/20 z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-pebble-grey/15 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {step !== "pick" && !done && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-xs font-bold text-pebble-grey hover:text-deep-slate transition-colors focus-ring rounded-lg shrink-0"
              >
                <ChevronLeftIcon size={14} />
                Back
              </button>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider font-nunito">
                Groomer dashboard
              </p>
              <h2 className="font-fredoka text-2xl text-deep-slate leading-tight">
                {done ? "Booking added!" : heading}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 bg-white/80 border border-pebble-grey/10 text-deep-slate hover:text-muted-terracotta transition-colors focus-ring shrink-0 ml-3"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Done state */}
        {done ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-14 h-14 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-2xl">
              🐾
            </div>
            <p className="font-fredoka text-xl text-deep-slate">
              {doneClientName}&apos;s appointment is in your calendar.
            </p>
            <button onClick={onClose} className="btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring">
              Done
            </button>
          </div>

        ) : step === "pick" ? (
          /* ── Step 1: client picker ── */
          <div className="overflow-y-auto px-6 py-4 space-y-2">
            {existingClients.length > 0 && (
              <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider mb-3">Recent clients</p>
            )}
            {existingClients.map((client) => (
              <button
                key={client.ownerId}
                onClick={() => pickClient(client)}
                className="w-full flex items-center justify-between gap-3 bg-white border border-pebble-grey/15 rounded-2xl px-4 py-3 hover:border-deep-slate/30 hover:bg-white transition-colors focus-ring group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ClientAvatar name={client.name} />
                  <div className="min-w-0 text-left">
                    <p className="font-bold text-deep-slate text-sm">{client.name}</p>
                    <p className="text-xs text-pebble-grey truncate">
                      {client.dogs.map(d => d.name).join(", ") || "No dogs on file"}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon size={16} className="text-pebble-grey group-hover:text-deep-slate transition-colors shrink-0" />
              </button>
            ))}

            <button
              onClick={goNew}
              className="w-full flex items-center justify-between gap-3 border-2 border-dashed border-pebble-grey/30 rounded-2xl px-4 py-3.5 hover:border-deep-slate/40 hover:bg-white/50 transition-colors focus-ring group mt-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pebble-grey/10 flex items-center justify-center text-xl font-bold text-pebble-grey group-hover:bg-pebble-grey/20 transition-colors">+</div>
                <p className="font-bold text-deep-slate text-sm">Someone new</p>
              </div>
              <ChevronRightIcon size={16} className="text-pebble-grey group-hover:text-deep-slate transition-colors shrink-0" />
            </button>
          </div>

        ) : step === "existing" && selectedClient ? (
          /* ── Step 2a: existing client ── */
          <form onSubmit={submitExisting} className="overflow-y-auto px-6 py-5 space-y-4">
            {/* Dog picker */}
            {selectedClient.dogs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey mb-2">Dog</p>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.dogs.map((dog, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDogIdx(i)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-colors focus-ring ${
                        selectedDogIdx === i
                          ? "border-deep-slate bg-deep-slate text-alabaster-cream"
                          : "border-pebble-grey/20 text-deep-slate hover:border-deep-slate/40"
                      }`}
                    >
                      {dog.name}
                      {dog.breed && <span className={`text-xs font-normal ${selectedDogIdx === i ? "text-alabaster-cream/70" : "text-pebble-grey"}`}>{dog.breed}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service */}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Service</span>
              {bookableServices.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted-terracotta font-bold">Add services in your Profile tab first.</p>
              ) : (
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required className="field mt-1.5 cursor-pointer">
                  {bookableServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.duration} min — £{(s.price / 100).toFixed(0)}</option>
                  ))}
                </select>
              )}
            </label>

            {/* Date + time */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Date</span>
                <input type="date" className="field mt-1.5" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Time</span>
                <input type="time" className="field mt-1.5" value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
            </div>

            {selectedService && (
              <div className="flex justify-between items-center bg-white border border-pebble-grey/10 rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Total</span>
                <span className="font-fredoka text-xl text-deep-slate">£{(selectedService.price / 100).toFixed(0)}</span>
              </div>
            )}

            {error && <p className="text-sm font-bold text-muted-terracotta">{error}</p>}

            <div className="flex gap-3 pt-1 pb-2">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary font-nunito font-bold py-3 rounded-full text-sm focus-ring">Cancel</button>
              <button type="submit" disabled={isPending || bookableServices.length === 0} className="flex-1 btn-primary font-nunito font-bold py-3 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50">
                {isPending ? "Adding…" : "Add booking"}
              </button>
            </div>
          </form>

        ) : (
          /* ── Step 2b: new client ── */
          <form onSubmit={submitNew} className="overflow-y-auto px-6 py-5 space-y-4">
            {/* Client + dog name */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Client name</span>
                <input className="field mt-1.5" placeholder="e.g. Sarah M." value={clientName} onChange={(e) => setClientName(e.target.value)} required />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Dog name</span>
                <input className="field mt-1.5" placeholder="e.g. Biscuit" value={dogName} onChange={(e) => setDogName(e.target.value)} required />
              </label>
            </div>

            {/* Breed */}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Breed</span>
              <select value={dogBreed} onChange={(e) => setDogBreed(e.target.value)} className="field mt-1.5 cursor-pointer">
                <option value="">Select breed…</option>
                {DOG_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>

            {/* Service */}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Service</span>
              {bookableServices.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted-terracotta font-bold">Add services in your Profile tab first.</p>
              ) : (
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required className="field mt-1.5 cursor-pointer">
                  {bookableServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.duration} min — £{(s.price / 100).toFixed(0)}</option>
                  ))}
                </select>
              )}
            </label>

            {/* Date + time */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Date</span>
                <input type="date" className="field mt-1.5" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Time</span>
                <input type="time" className="field mt-1.5" value={time} onChange={(e) => setTime(e.target.value)} required />
              </label>
            </div>

            {/* Notes */}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Notes (optional)</span>
              <textarea className="field mt-1.5 min-h-[72px] resize-none" placeholder="e.g. First visit, anxious around dryers" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            {selectedService && (
              <div className="flex justify-between items-center bg-white border border-pebble-grey/10 rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Total</span>
                <span className="font-fredoka text-xl text-deep-slate">£{(selectedService.price / 100).toFixed(0)}</span>
              </div>
            )}

            {error && <p className="text-sm font-bold text-muted-terracotta">{error}</p>}

            <div className="flex gap-3 pt-1 pb-2">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary font-nunito font-bold py-3 rounded-full text-sm focus-ring">Cancel</button>
              <button type="submit" disabled={isPending || bookableServices.length === 0} className="flex-1 btn-primary font-nunito font-bold py-3 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50">
                {isPending ? "Adding…" : "Add booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
