"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { addDog, updateDog, getCloudinarySignature } from "@/app/actions/dogs";
import type { Dog } from "@/app/actions/dogs";

interface AddDogModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (dog: Dog) => void;
  editing?: Dog;
}

const SIZES: { value: NonNullable<Dog["size"]>; label: string }[] = [
  { value: "small",  label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large",  label: "Large" },
  { value: "giant",  label: "Giant" },
];

const COAT_TYPES: { value: NonNullable<Dog["coat_type"]>; label: string }[] = [
  { value: "short",  label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long",   label: "Long" },
  { value: "curly",  label: "Curly" },
  { value: "double", label: "Double" },
  { value: "wire",   label: "Wire" },
];

export function AddDogModal({ open, onClose, onSaved, editing }: AddDogModalProps) {
  const [name, setName]               = useState(editing?.name ?? "");
  const [breed, setBreed]             = useState(editing?.breed ?? "");
  const [dob, setDob]                 = useState(editing?.date_of_birth ?? "");
  const [size, setSize]               = useState<Dog["size"]>(editing?.size ?? null);
  const [neutered, setNeutered]       = useState<"true" | "false" | "">(
    editing?.is_neutered === true ? "true" : editing?.is_neutered === false ? "false" : ""
  );
  const [coatType, setCoatType]       = useState<Dog["coat_type"]>(editing?.coat_type ?? null);
  const [coatNotes, setCoatNotes]     = useState(editing?.coat_notes ?? "");
  const [tempNotes, setTempNotes]     = useState(editing?.temperament_notes ?? "");
  const [healthNotes, setHealthNotes] = useState(editing?.health_notes ?? "");
  const [photoUrl, setPhotoUrl]       = useState(editing?.profile_image_url ?? "");
  const [photoPreview, setPhotoPreview] = useState(editing?.profile_image_url ?? "");
  const [showNotes, setShowNotes]     = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState("");
  const [isPending, startTransition]  = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editing;

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    try {
      const sigResult = await getCloudinarySignature();
      if ("error" in sigResult) { setError(sigResult.error); setUploading(false); return; }

      const { signature, timestamp, cloudName, apiKey, folder } = sigResult;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("signature", signature);
      fd.append("timestamp", String(timestamp));
      fd.append("api_key", apiKey);
      fd.append("folder", folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();

      if (data.secure_url) {
        setPhotoUrl(data.secure_url);
      } else {
        setError("Photo upload failed.");
      }
    } catch {
      setError("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append("name", name);
    if (breed)       fd.append("breed", breed);
    if (dob)         fd.append("date_of_birth", dob);
    if (size)        fd.append("size", size);
    if (neutered)    fd.append("is_neutered", neutered);
    if (coatType)    fd.append("coat_type", coatType);
    if (coatNotes)   fd.append("coat_notes", coatNotes);
    if (tempNotes)   fd.append("temperament_notes", tempNotes);
    if (healthNotes) fd.append("health_notes", healthNotes);
    if (photoUrl)    fd.append("profile_image_url", photoUrl);
    return fd;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Give your dog a name."); return; }

    startTransition(async () => {
      const result = isEdit
        ? await updateDog(editing.id, buildFormData())
        : await addDog(buildFormData());

      if ("error" in result) {
        setError(result.error);
      } else {
        onSaved(result.dog);
        onClose();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <h2 className="font-fredoka text-2xl text-deep-slate mb-6">
        {isEdit ? `Edit ${editing.name}` : "Add a dog"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl overflow-hidden bg-alabaster-cream border-2 border-dashed border-pebble-grey/30 hover:border-sage-leaf/50 transition-colors flex items-center justify-center focus-ring shrink-0"
          >
            {photoPreview ? (
              <Image src={photoPreview} alt="Preview" fill className="object-cover" sizes="80px" />
            ) : (
              <Camera size={22} className="text-pebble-grey" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="text-xs text-pebble-grey font-nunito">Uploading…</span>
              </div>
            )}
          </button>
          <div>
            <p className="text-sm font-nunito text-deep-slate font-semibold">Dog photo</p>
            <p className="text-xs text-pebble-grey font-nunito mt-0.5">Optional · JPG or PNG</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-nunito font-semibold text-deep-slate mb-1.5">
            Name <span className="text-muted-terracotta">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Biscuit"
            className="w-full border border-pebble-grey/30 rounded-xl px-4 py-2.5 text-deep-slate font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-sage-leaf/40 bg-white"
          />
        </div>

        {/* Breed */}
        <div>
          <label className="block text-sm font-nunito font-semibold text-deep-slate mb-1.5">Breed</label>
          <input
            type="text"
            value={breed}
            onChange={e => setBreed(e.target.value)}
            placeholder="e.g. Cockapoo"
            className="w-full border border-pebble-grey/30 rounded-xl px-4 py-2.5 text-deep-slate font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-sage-leaf/40 bg-white"
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm font-nunito font-semibold text-deep-slate mb-1.5">Date of birth</label>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="w-full border border-pebble-grey/30 rounded-xl px-4 py-2.5 text-deep-slate font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-sage-leaf/40 bg-white"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-nunito font-semibold text-deep-slate mb-2">Size</label>
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSize(size === s.value ? null : s.value)}
                className={cn(
                  "py-2 rounded-xl text-sm font-nunito font-semibold border transition-colors focus-ring",
                  size === s.value
                    ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                    : "bg-white text-pebble-grey border-pebble-grey/30 hover:border-deep-slate/40"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Neutered */}
        <div>
          <label className="block text-sm font-nunito font-semibold text-deep-slate mb-2">Neutered?</label>
          <div className="grid grid-cols-3 gap-2">
            {(["true", "false", ""] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setNeutered(neutered === v ? "" : v)}
                className={cn(
                  "py-2 rounded-xl text-sm font-nunito font-semibold border transition-colors focus-ring",
                  neutered === v && v !== ""
                    ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                    : "bg-white text-pebble-grey border-pebble-grey/30 hover:border-deep-slate/40"
                )}
              >
                {v === "true" ? "Yes" : v === "false" ? "No" : "Unknown"}
              </button>
            ))}
          </div>
        </div>

        {/* Coat type */}
        <div>
          <label className="block text-sm font-nunito font-semibold text-deep-slate mb-2">Coat type</label>
          <div className="grid grid-cols-3 gap-2">
            {COAT_TYPES.map(ct => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setCoatType(coatType === ct.value ? null : ct.value)}
                className={cn(
                  "py-2 rounded-xl text-sm font-nunito font-semibold border transition-colors focus-ring",
                  coatType === ct.value
                    ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                    : "bg-white text-pebble-grey border-pebble-grey/30 hover:border-deep-slate/40"
                )}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional notes toggle */}
        <button
          type="button"
          onClick={() => setShowNotes(v => !v)}
          className="flex items-center gap-1.5 text-sm font-nunito font-semibold text-pebble-grey hover:text-deep-slate transition-colors focus-ring rounded"
        >
          {showNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showNotes ? "Hide" : "Add"} notes
        </button>

        {showNotes && (
          <div className="space-y-4">
            {[
              { label: "Coat notes", value: coatNotes, set: setCoatNotes, placeholder: "e.g. Matts easily behind ears" },
              { label: "Temperament notes", value: tempNotes, set: setTempNotes, placeholder: "e.g. Anxious around loud noises" },
              { label: "Health notes", value: healthNotes, set: setHealthNotes, placeholder: "e.g. Allergic to certain shampoos" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-nunito font-semibold text-deep-slate mb-1.5">{label}</label>
                <textarea
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full border border-pebble-grey/30 rounded-xl px-4 py-2.5 text-deep-slate font-nunito text-sm focus:outline-none focus:ring-2 focus:ring-sage-leaf/40 bg-white resize-none"
                />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-terracotta font-nunito">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || uploading}
          className="btn-primary w-full font-nunito font-bold py-3 rounded-full disabled:opacity-60"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Add dog"}
        </button>
      </form>
    </Modal>
  );
}
