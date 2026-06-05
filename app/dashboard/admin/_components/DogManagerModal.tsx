"use client";

import { useState, useEffect, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { PencilIcon, TrashIcon, PlusIcon } from "@/components/ui/GroomrIcons";
import { adminGetDogsFull, adminAddDog, adminUpdateDog, adminDeleteDog } from "@/app/actions/admin";
import type { AdminDogFull } from "@/app/actions/admin";

interface Props {
  ownerProfileId: string;
  ownerName: string;
  onClose: () => void;
}

const DOG_SIZES = ["small", "medium", "large", "giant"] as const;
const COAT_TYPES = ["short", "medium", "long", "curly", "double", "wire"] as const;

const SIZE_LABELS: Record<string, string> = {
  small: "Small", medium: "Medium", large: "Large", giant: "Giant",
};
const COAT_LABELS: Record<string, string> = {
  short: "Short", medium: "Medium", long: "Long", curly: "Curly", double: "Double", wire: "Wire",
};

const EMPTY_FORM = {
  name: "",
  breed: "",
  date_of_birth: "",
  size: "",
  is_neutered: false,
  coat_type: "",
  coat_notes: "",
  temperament_notes: "",
  health_notes: "",
};

type DogFormState = typeof EMPTY_FORM;

function DogForm({
  form,
  setForm,
  onSave,
  onCancel,
  pending,
  mode,
}: {
  form: DogFormState;
  setForm: React.Dispatch<React.SetStateAction<DogFormState>>;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  mode: "add" | "edit";
}) {
  function upd(key: keyof DogFormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="bg-alabaster-cream/60 border border-pebble-grey/20 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
        {mode === "add" ? "New dog" : "Edit dog"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Name *</label>
          <input
            className="field w-full"
            value={form.name}
            onChange={(e) => upd("name", e.target.value)}
            placeholder="e.g. Buddy"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Breed</label>
          <input
            className="field w-full"
            value={form.breed}
            onChange={(e) => upd("breed", e.target.value)}
            placeholder="e.g. Labrador"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Date of birth</label>
          <input
            type="date"
            className="field w-full"
            value={form.date_of_birth}
            onChange={(e) => upd("date_of_birth", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Size</label>
          <select className="field w-full" value={form.size} onChange={(e) => upd("size", e.target.value)}>
            <option value="">— Select —</option>
            {DOG_SIZES.map((s) => (
              <option key={s} value={s}>{SIZE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Coat type</label>
          <select className="field w-full" value={form.coat_type} onChange={(e) => upd("coat_type", e.target.value)}>
            <option value="">— Select —</option>
            {COAT_TYPES.map((c) => (
              <option key={c} value={c}>{COAT_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center pt-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_neutered}
              onChange={(e) => upd("is_neutered", e.target.checked)}
              className="w-4 h-4 accent-groomr-gold rounded"
            />
            <span className="text-sm font-bold text-deep-slate">Neutered / spayed</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Coat notes</label>
        <input
          className="field w-full"
          value={form.coat_notes}
          onChange={(e) => upd("coat_notes", e.target.value)}
          placeholder="Any coat-specific notes…"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Temperament notes</label>
        <input
          className="field w-full"
          value={form.temperament_notes}
          onChange={(e) => upd("temperament_notes", e.target.value)}
          placeholder="e.g. Anxious around strangers"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Health notes</label>
        <input
          className="field w-full"
          value={form.health_notes}
          onChange={(e) => upd("health_notes", e.target.value)}
          placeholder="e.g. Hip dysplasia"
        />
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
          disabled={pending || !form.name.trim()}
        >
          {pending ? "Saving…" : "Save dog"}
        </button>
      </div>
    </div>
  );
}

export function DogManagerModal({ ownerProfileId, ownerName, onClose }: Props) {
  const [dogs, setDogs] = useState<AdminDogFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<DogFormState>(EMPTY_FORM);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminGetDogsFull(ownerProfileId).then((res) => {
      if ("data" in res) setDogs(res.data);
      else setToast(res.error);
      setLoading(false);
    });
  }, [ownerProfileId]);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId("new");
  }

  function startEdit(dog: AdminDogFull) {
    setForm({
      name: dog.name,
      breed: dog.breed ?? "",
      date_of_birth: dog.date_of_birth ?? "",
      size: dog.size ?? "",
      is_neutered: dog.is_neutered ?? false,
      coat_type: dog.coat_type ?? "",
      coat_notes: dog.coat_notes ?? "",
      temperament_notes: dog.temperament_notes ?? "",
      health_notes: dog.health_notes ?? "",
    });
    setEditingId(dog.id);
  }

  function cancelForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const fields = {
      name: form.name.trim(),
      breed: form.breed || null,
      date_of_birth: form.date_of_birth || null,
      size: form.size || null,
      is_neutered: form.is_neutered,
      coat_type: form.coat_type || null,
      coat_notes: form.coat_notes || null,
      temperament_notes: form.temperament_notes || null,
      health_notes: form.health_notes || null,
    };
    startTransition(async () => {
      if (editingId === "new") {
        const res = await adminAddDog(ownerProfileId, fields);
        if ("error" in res) {
          setToast(res.error);
        } else {
          setDogs((prev) => [...prev, res.data]);
          setToast("Dog added.");
          cancelForm();
        }
      } else if (editingId) {
        const res = await adminUpdateDog(editingId, fields);
        if ("error" in res) {
          setToast(res.error);
        } else {
          setDogs((prev) =>
            prev.map((d) => (d.id === editingId ? { ...d, ...fields } : d))
          );
          setToast("Dog updated.");
          cancelForm();
        }
      }
    });
  }

  function handleDelete(dogId: string) {
    setDeletingId(dogId);
    startTransition(async () => {
      const res = await adminDeleteDog(dogId);
      setDeletingId(null);
      if ("error" in res) {
        setToast(res.error);
      } else {
        setDogs((prev) => prev.filter((d) => d.id !== dogId));
        setToast("Dog removed.");
        if (editingId === dogId) cancelForm();
      }
    });
  }

  return (
    <>
      <Modal open size="lg" onClose={onClose}>
        <div className="space-y-3">
          <div>
            <h2 className="font-fredoka text-2xl text-deep-slate">Dogs</h2>
            <p className="text-sm text-pebble-grey font-bold mt-0.5">{ownerName}</p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-pebble-grey font-bold">Loading…</div>
          ) : (
            <>
              {dogs.length === 0 && editingId !== "new" && (
                <p className="py-4 text-sm text-pebble-grey font-bold text-center">
                  No dogs on this account yet.
                </p>
              )}

              <div className="space-y-2">
                {dogs.map((dog) =>
                  editingId === dog.id ? (
                    <DogForm
                      key={dog.id}
                      form={form}
                      setForm={setForm}
                      onSave={handleSave}
                      onCancel={cancelForm}
                      pending={pending}
                      mode="edit"
                    />
                  ) : (
                    <div
                      key={dog.id}
                      className="flex items-center justify-between bg-white border border-pebble-grey/20 rounded-2xl px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-deep-slate">{dog.name}</p>
                        <p className="text-xs text-pebble-grey mt-0.5">
                          {[
                            dog.breed,
                            dog.size ? SIZE_LABELS[dog.size] : null,
                            dog.coat_type ? `${COAT_LABELS[dog.coat_type]} coat` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No details set"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(dog)}
                          disabled={!!editingId}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pebble-grey/10 text-deep-slate hover:bg-pebble-grey/20 border border-pebble-grey/20 transition-colors focus-ring disabled:opacity-40"
                        >
                          <PencilIcon size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dog.id)}
                          disabled={deletingId === dog.id || !!editingId}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted-terracotta/10 text-muted-terracotta hover:bg-muted-terracotta/20 border border-muted-terracotta/30 transition-colors focus-ring disabled:opacity-40"
                        >
                          <TrashIcon size={12} />
                          {deletingId === dog.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )
                )}

                {editingId === "new" ? (
                  <DogForm
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
                    Add a dog
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
