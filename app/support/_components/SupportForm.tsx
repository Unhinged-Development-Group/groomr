"use client";

import { useRef, useState, useTransition } from "react";
import { sendSupportRequest } from "@/app/actions/support";
import { UploadIcon, CloseIcon, CheckIcon } from "@/components/ui/GroomrIcons";

const SUBJECTS = [
  "Booking issue",
  "Booking issue — URGENT",
  "Account or login problem",
  "Payment or deposit query",
  "Report a groomer",
  "Technical issue",
  "Other",
];

const MAX_IMAGES = 5;

export function SupportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  const [files, setFiles]       = useState<File[]>([]);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const allowed = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => {
      const combined = [...prev, ...allowed];
      return combined.slice(0, MAX_IMAGES);
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const raw = new FormData(formRef.current!);
    raw.delete("images");
    for (const f of files) raw.append("images", f);

    startTransition(async () => {
      const result = await sendSupportRequest(raw);
      if (result.ok) {
        setSuccess(true);
        formRef.current?.reset();
        setFiles([]);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-[20px] bg-white border border-pebble-grey/20 p-8 text-center space-y-4 shadow-subtle">
        <div className="mx-auto w-14 h-14 rounded-full bg-groomr-gold/20 flex items-center justify-center">
          <CheckIcon size={28} className="text-deep-slate" />
        </div>
        <h3 className="font-fredoka text-2xl text-deep-slate">Message sent!</h3>
        <p className="text-pebble-grey font-nunito text-sm leading-relaxed">
          We&apos;ve received your message and will get back to you at the email
          you provided — usually within one business day.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-link text-sm font-nunito font-bold"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-[20px] bg-white border border-pebble-grey/20 p-6 md:p-8 space-y-5 shadow-subtle"
    >
      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="sf-name" className="block text-sm font-nunito font-bold text-deep-slate">
            Your name <span className="text-muted-terracotta">*</span>
          </label>
          <input
            id="sf-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Smith"
            className="field w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sf-email" className="block text-sm font-nunito font-bold text-deep-slate">
            Email address <span className="text-muted-terracotta">*</span>
          </label>
          <input
            id="sf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@example.com"
            className="field w-full"
          />
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <label htmlFor="sf-subject" className="block text-sm font-nunito font-bold text-deep-slate">
          Subject <span className="text-muted-terracotta">*</span>
        </label>
        <select id="sf-subject" name="subject" required className="field w-full">
          <option value="">Select a topic…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="sf-message" className="block text-sm font-nunito font-bold text-deep-slate">
          Message <span className="text-muted-terracotta">*</span>
        </label>
        <textarea
          id="sf-message"
          name="message"
          required
          rows={5}
          placeholder="Describe your issue in as much detail as possible…"
          className="field w-full resize-none"
        />
      </div>

      {/* Image attachments */}
      <div className="space-y-2">
        <p className="text-sm font-nunito font-bold text-deep-slate">
          Attach images{" "}
          <span className="font-normal text-pebble-grey">(optional — up to {MAX_IMAGES}, 5 MB each)</span>
        </p>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl bg-alabaster-cream px-4 py-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <span className="flex-1 truncate text-sm font-nunito text-deep-slate">
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded"
                  aria-label={`Remove ${f.name}`}
                >
                  <CloseIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {files.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm font-nunito font-bold text-sage-leaf hover:text-deep-slate transition-colors focus-ring rounded"
          >
            <UploadIcon size={16} />
            {files.length === 0 ? "Add images" : "Add more"}
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-muted-terracotta font-nunito font-bold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
