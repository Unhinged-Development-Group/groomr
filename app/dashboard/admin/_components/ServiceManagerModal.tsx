"use client";

import { useState, useEffect, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { PencilIcon, TrashIcon, PlusIcon } from "@/components/ui/GroomrIcons";
import { adminGetServices, adminSaveService, adminDeleteService } from "@/app/actions/admin";
import type { AdminServiceRow } from "@/app/actions/admin";

interface Props {
  groomerProfileId: string;
  businessName: string;
  onClose: () => void;
}

const DOG_SIZES = ["small", "medium", "large", "giant"] as const;
const SIZE_LABELS: Record<string, string> = {
  small: "Small", medium: "Medium", large: "Large", giant: "Giant",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  price_pounds: "",
  duration_minutes: "",
  is_active: true,
  applicable_sizes: [] as string[],
};

type ServiceFormState = typeof EMPTY_FORM;

function ServiceForm({
  form,
  setForm,
  onSave,
  onCancel,
  pending,
  mode,
}: {
  form: ServiceFormState;
  setForm: React.Dispatch<React.SetStateAction<ServiceFormState>>;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  mode: "add" | "edit";
}) {
  function upd(key: keyof ServiceFormState, value: string | boolean | string[]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSize(size: string) {
    setForm((f) => ({
      ...f,
      applicable_sizes: f.applicable_sizes.includes(size)
        ? f.applicable_sizes.filter((s) => s !== size)
        : [...f.applicable_sizes, size],
    }));
  }

  const parsedPrice = parseFloat(form.price_pounds);
  const isValid = form.name.trim() !== "" && !isNaN(parsedPrice) && parsedPrice >= 0;

  return (
    <div className="bg-alabaster-cream/60 border border-pebble-grey/20 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
        {mode === "add" ? "New service" : "Edit service"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
            Service name *
          </label>
          <input
            className="field w-full"
            value={form.name}
            onChange={(e) => upd("name", e.target.value)}
            placeholder="e.g. Full groom"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
            Price (£) *
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            className="field w-full"
            value={form.price_pounds}
            onChange={(e) => upd("price_pounds", e.target.value)}
            placeholder="e.g. 45.00"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            min={0}
            step={5}
            className="field w-full"
            value={form.duration_minutes}
            onChange={(e) => upd("duration_minutes", e.target.value)}
            placeholder="e.g. 90"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">
            Description
          </label>
          <input
            className="field w-full"
            value={form.description}
            onChange={(e) => upd("description", e.target.value)}
            placeholder="Brief description of what's included…"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-2">
            Applicable sizes
          </label>
          <div className="flex flex-wrap gap-3">
            {DOG_SIZES.map((size) => (
              <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.applicable_sizes.includes(size)}
                  onChange={() => toggleSize(size)}
                  className="w-4 h-4 accent-groomr-gold"
                />
                <span className="text-sm font-bold text-deep-slate">{SIZE_LABELS[size]}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => upd("is_active", e.target.checked)}
              className="w-4 h-4 accent-groomr-gold rounded"
            />
            <span className="text-sm font-bold text-deep-slate">Active (visible to owners)</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
          onClick={onSave}
          disabled={pending || !isValid}
        >
          {pending ? "Saving…" : "Save service"}
        </button>
      </div>
    </div>
  );
}

export function ServiceManagerModal({ groomerProfileId, businessName, onClose }: Props) {
  const [services, setServices] = useState<AdminServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminGetServices(groomerProfileId).then((res) => {
      if ("data" in res) setServices(res.data);
      else setToast(res.error);
      setLoading(false);
    });
  }, [groomerProfileId]);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId("new");
  }

  function startEdit(svc: AdminServiceRow) {
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      price_pounds: (svc.price_pence / 100).toFixed(2),
      duration_minutes: svc.duration_minutes?.toString() ?? "",
      is_active: svc.is_active,
      applicable_sizes: svc.applicable_sizes ?? [],
    });
    setEditingId(svc.id);
  }

  function cancelForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSave() {
    const price = parseFloat(form.price_pounds);
    if (!form.name.trim() || isNaN(price) || price < 0) return;
    const fields = {
      name: form.name.trim(),
      description: form.description || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
      price_pence: Math.round(price * 100),
      is_active: form.is_active,
      applicable_sizes: form.applicable_sizes.length > 0 ? form.applicable_sizes : null,
    };
    startTransition(async () => {
      const svcId = editingId === "new" ? null : editingId;
      const res = await adminSaveService(groomerProfileId, svcId, fields);
      if ("error" in res) {
        setToast(res.error);
      } else {
        if (editingId === "new") {
          setServices((prev) => [...prev, res.data]);
          setToast("Service added.");
        } else {
          setServices((prev) => prev.map((s) => (s.id === editingId ? res.data : s)));
          setToast("Service updated.");
        }
        cancelForm();
      }
    });
  }

  function handleDelete(serviceId: string) {
    setDeletingId(serviceId);
    startTransition(async () => {
      const res = await adminDeleteService(serviceId);
      setDeletingId(null);
      if ("error" in res) {
        setToast(res.error);
      } else {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        setToast("Service deleted.");
        if (editingId === serviceId) cancelForm();
      }
    });
  }

  return (
    <>
      <Modal open size="lg" onClose={onClose}>
        <div className="space-y-3">
          <div>
            <h2 className="font-fredoka text-2xl text-deep-slate">Services</h2>
            <p className="text-sm text-pebble-grey font-bold mt-0.5">{businessName}</p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-pebble-grey font-bold">Loading…</div>
          ) : (
            <>
              {services.length === 0 && editingId !== "new" && (
                <p className="py-4 text-sm text-pebble-grey font-bold text-center">
                  No services set up yet.
                </p>
              )}

              <div className="space-y-2">
                {services.map((svc) =>
                  editingId === svc.id ? (
                    <ServiceForm
                      key={svc.id}
                      form={form}
                      setForm={setForm}
                      onSave={handleSave}
                      onCancel={cancelForm}
                      pending={pending}
                      mode="edit"
                    />
                  ) : (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between bg-white border border-pebble-grey/20 rounded-2xl px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-deep-slate">{svc.name}</p>
                          <Badge tone={svc.is_active ? "sage" : "grey"}>
                            {svc.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-pebble-grey mt-0.5">
                          £{(svc.price_pence / 100).toFixed(2)}
                          {svc.duration_minutes ? ` · ${svc.duration_minutes} min` : ""}
                          {svc.applicable_sizes?.length
                            ? ` · ${svc.applicable_sizes.map((s) => SIZE_LABELS[s] ?? s).join(", ")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(svc)}
                          disabled={!!editingId}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring disabled:opacity-40"
                        >
                          <PencilIcon size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          disabled={deletingId === svc.id || !!editingId}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20 border border-muted-terracotta/30 transition-colors focus-ring disabled:opacity-40"
                        >
                          <TrashIcon size={12} />
                          {deletingId === svc.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )
                )}

                {editingId === "new" ? (
                  <ServiceForm
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onCancel={cancelForm}
                    pending={pending}
                    mode="add"
                  />
                ) : (
                  <button
                    onClick={startAdd}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-pebble-grey/30 text-pebble-grey font-bold text-sm hover:border-groomr-gold hover:text-deep-slate transition-colors focus-ring"
                  >
                    <PlusIcon size={16} />
                    Add a service
                  </button>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-1">
            <button
              className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
