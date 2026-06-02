"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { contactUser } from "@/app/actions/admin";

interface Props {
  toEmail: string;
  toName: string;
  onClose: () => void;
}

export function ContactModal({ toEmail, toName, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    startTransition(async () => {
      const result = await contactUser(toEmail, toName, subject, body);
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Email sent.");
        setTimeout(onClose, 1200);
      }
    });
  }

  return (
    <>
      <Modal open onClose={onClose}>
        <div className="space-y-4">
          <h2 className="font-fredoka text-2xl text-deep-slate">Email {toName}</h2>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">To</label>
            <p className="text-sm text-deep-slate font-bold">{toName} &lt;{toEmail}&gt;</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Subject</label>
            <input
              className="field w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Message</label>
            <textarea
              className="field w-full min-h-[120px] resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
              onClick={handleSend}
              disabled={pending || !subject.trim() || !body.trim()}
            >
              {pending ? "Sending…" : "Send email"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
