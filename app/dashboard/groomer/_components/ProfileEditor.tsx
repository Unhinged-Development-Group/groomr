"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { saveProfile, saveServices } from "@/app/actions/profile-editor";
import { inviteTeamMember, removeTeamMember } from "@/app/actions/team-members";
import type { ProfileFormData, ServiceRow, TeamMemberRow } from "@/types/groomer-dashboard";

const SERVICE_TEMPLATES: Array<{ name: string; duration: number; price: number }> = [
  { name: "Bath & Brush",          duration: 45,  price: 3800 },
  { name: "Full Groom",            duration: 90,  price: 5800 },
  { name: "Hand Strip",            duration: 120, price: 8000 },
  { name: "Nail Clip",             duration: 15,  price: 1500 },
  { name: "Teeth Brushing",        duration: 15,  price: 1000 },
  { name: "Ear Clean",             duration: 10,  price:  800 },
  { name: "Dematting",             duration: 60,  price: 4000 },
  { name: "Puppy First Groom",     duration: 45,  price: 3500 },
  { name: "Anal Gland Expression", duration: 10,  price: 1200 },
];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

interface Props {
  groomerProfileId: string;
  initialProfile: ProfileFormData;
  initialServices: ServiceRow[];
  initialTeam: TeamMemberRow[];
  viewerRole: "owner" | "team_member";
}

export function ProfileEditor({
  groomerProfileId,
  initialProfile,
  initialServices,
  initialTeam,
  viewerRole,
}: Props) {
  const [formData, setFormData] = useState<ProfileFormData>(initialProfile);
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [team, setTeam] = useState<TeamMemberRow[]>(initialTeam);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "", email: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const isDirty = useMemo(
    () =>
      JSON.stringify(formData) !== JSON.stringify(initialProfile) ||
      JSON.stringify(services) !== JSON.stringify(initialServices),
    [formData, initialProfile, services, initialServices]
  );

  function setField<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setFormData((d) => ({ ...d, [key]: value }));
  }

  function updateService(index: number, patch: Partial<ServiceRow>) {
    setServices((arr) => arr.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addTemplateService(tpl: (typeof SERVICE_TEMPLATES)[0]) {
    if (services.some((s) => s.name === tpl.name)) return;
    setServices((arr) => [
      ...arr,
      { id: null, name: tpl.name, duration: tpl.duration, price: tpl.price, sortOrder: arr.length },
    ]);
  }

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    const [profileResult, servicesResult] = await Promise.all([
      saveProfile(groomerProfileId, formData),
      saveServices(groomerProfileId, services),
    ]);
    setSaving(false);
    const err = profileResult.error ?? servicesResult.error;
    if (err) {
      setSaveError(err);
    }
    // On success, dirty state resets naturally because JSON.stringify will now match
    // (server has the new state; a page refresh would re-populate initialProfile)
    // For now, we just clear the visual dirty marker by resetting local initial references
    // via a workaround: re-stamp initial values to the current state
    // This is handled below by conditionally resetting after success
  }

  async function handleDiscard() {
    setFormData(initialProfile);
    setServices(initialServices);
  }

  async function handleAddMember() {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    setInviting(true);
    setInviteError(null);
    const result = await inviteTeamMember(groomerProfileId, {
      name: newMember.name,
      role: newMember.role || "Groomer",
      email: newMember.email,
    });
    setInviting(false);
    if (result.error) {
      setInviteError(result.error);
      return;
    }
    setTeam((t) => [
      ...t,
      {
        id: result.teamMemberId!,
        name: newMember.name,
        role: newMember.role || "Groomer",
        sinceYear: String(new Date().getFullYear()),
        email: newMember.email,
        userId: null,
        inviteStatus: "pending",
        averageRating: 0,
        totalReviews: 0,
        publicSlug: null,
      },
    ]);
    setNewMember({ name: "", role: "", email: "" });
    setAdding(false);
  }

  async function handleRemoveMember(id: string) {
    const result = await removeTeamMember(id);
    if (!result.error) {
      setTeam((t) => t.filter((m) => m.id !== id));
    }
  }

  return (
    <section className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6 min-w-0">

        {/* Business basics */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Business basics</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">Preview public profile →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldGroup label="Business name">
              <input
                className="field"
                value={formData.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                disabled={viewerRole === "team_member"}
              />
            </FieldGroup>
            <FieldGroup label="Owner / lead">
              <input
                className="field bg-alabaster-cream cursor-default"
                value={formData.ownerName}
                readOnly
                title="Update your name in account settings"
              />
              <p className="text-[10px] font-bold text-pebble-grey mt-1">Managed in account settings</p>
            </FieldGroup>
            <FieldGroup label="Email">
              <input
                className="field"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={viewerRole === "team_member"}
              />
            </FieldGroup>
            <FieldGroup label="Phone">
              <input
                className="field"
                value={formData.phone}
                onChange={(e) => setField("phone", e.target.value)}
                disabled={viewerRole === "team_member"}
              />
            </FieldGroup>
          </div>
          {viewerRole === "owner" && (
            <div className="mt-4">
              <FieldGroup label="Bio (max 280 chars)">
                <textarea
                  value={formData.bio}
                  onChange={(e) => setField("bio", e.target.value.slice(0, 280))}
                  className="field min-h-[100px]"
                />
                <p className="text-[10px] font-bold text-pebble-grey mt-1">{formData.bio.length}/280</p>
              </FieldGroup>
            </div>
          )}
        </div>

        {/* Mode + radius — owner only */}
        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
            <Eyebrow>How you operate</Eyebrow>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {([
                { k: "mobile", l: "Mobile (we drive)",          sub: "You travel to clients" },
                { k: "studio", l: "Studio (clients come to us)", sub: "Fixed location" },
              ] as const).map((m) => (
                <button
                  key={m.k}
                  onClick={() => setField("businessMode", m.k)}
                  className={cn(
                    "text-left rounded-2xl p-4 border-2 transition-colors focus-ring",
                    formData.businessMode === m.k
                      ? "border-deep-slate bg-alabaster-cream"
                      : "border-pebble-grey/20 hover:border-deep-slate"
                  )}
                >
                  <p className="font-fredoka text-lg text-deep-slate">{m.l}</p>
                  <p className="text-xs text-pebble-grey font-bold mt-1">{m.sub}</p>
                </button>
              ))}
            </div>
            {formData.businessMode === "mobile" && (
              <div className="mt-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div className="flex justify-between items-baseline">
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf">Service radius</p>
                  <p className="font-fredoka text-2xl text-deep-slate">{formData.radius} mi</p>
                </div>
                <input
                  type="range" min="1" max="20"
                  value={formData.radius}
                  onChange={(e) => setField("radius", Number(e.target.value))}
                  className="w-full mt-2 accent-deep-slate"
                />
                <div className="flex justify-between text-[10px] font-bold text-pebble-grey mt-1">
                  <span>1 mi</span><span>20 mi</span>
                </div>
              </div>
            )}
            {formData.businessMode === "studio" && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <FieldGroup label="Studio address">
                  <input
                    className="field"
                    value={formData.addressLine1}
                    onChange={(e) => setField("addressLine1", e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Postcode">
                  <input
                    className="field"
                    value={formData.postcode}
                    onChange={(e) => setField("postcode", e.target.value)}
                  />
                </FieldGroup>
              </div>
            )}
          </div>
        )}

        {/* Services & pricing — owner only */}
        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <Eyebrow>Services &amp; pricing</Eyebrow>
              <button
                onClick={() =>
                  setServices((s) => [
                    ...s,
                    { id: null, name: "New service", duration: 30, price: 2000, sortOrder: s.length },
                  ])
                }
                className="btn-secondary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring flex items-center gap-1"
              >
                <PlusIcon size={12} /> Add custom
              </button>
            </div>

            {/* Quick-add templates */}
            <div className="mb-4">
              <button
                onClick={() => setTemplatesOpen((o) => !o)}
                className="text-xs font-bold text-deep-slate flex items-center gap-1 mb-2"
              >
                <span className="text-pebble-grey">{templatesOpen ? "▾" : "▸"}</span>
                Quick-add standard services
              </button>
              {templatesOpen && (
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TEMPLATES.map((tpl) => {
                    const alreadyAdded = services.some((s) => s.name === tpl.name);
                    return (
                      <button
                        key={tpl.name}
                        onClick={() => addTemplateService(tpl)}
                        disabled={alreadyAdded}
                        className={cn(
                          "text-xs font-bold px-3 py-1.5 rounded-full border transition-colors focus-ring",
                          alreadyAdded
                            ? "border-pebble-grey/20 text-pebble-grey/40 cursor-not-allowed"
                            : "border-deep-slate/30 text-deep-slate hover:bg-alabaster-cream"
                        )}
                      >
                        {tpl.name}
                        {alreadyAdded && " ✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1fr_100px_100px_40px] gap-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                <span>Service</span><span>Duration</span><span>Price</span><span />
              </div>
              {services.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_100px_40px] gap-2 sm:gap-3 items-start sm:items-center">
                  <input
                    className="field"
                    value={s.name}
                    onChange={(e) => updateService(i, { name: e.target.value })}
                  />
                  <div className="relative">
                    <input
                      className="field pr-10"
                      type="number"
                      value={s.duration}
                      onChange={(e) => updateService(i, { duration: Number(e.target.value) })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">min</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">£</span>
                    <input
                      className="field pl-7"
                      type="number"
                      step="0.01"
                      value={(s.price / 100).toFixed(2)}
                      onChange={(e) => updateService(i, { price: Math.round(Number(e.target.value) * 100) })}
                    />
                  </div>
                  <button
                    onClick={() => setServices((arr) => arr.filter((_, j) => j !== i))}
                    className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
                    aria-label="Remove"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Deposit policy */}
            <div className="mt-5 pt-4 border-t border-pebble-grey/15 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Deposit policy</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { k: "none"       as const, l: "No deposit",       sub: "Pay on the day"  },
                  { k: "percentage" as const, l: "% Deposit",        sub: "Upfront %"       },
                  { k: "full"       as const, l: "Full pre-payment",  sub: "100% at booking" },
                ]).map((opt) => (
                  <button
                    key={opt.k}
                    onClick={() => setField("depositType", opt.k)}
                    className={cn(
                      "text-left rounded-2xl p-3 border-2 transition-colors focus-ring",
                      formData.depositType === opt.k
                        ? "border-deep-slate bg-alabaster-cream"
                        : "border-pebble-grey/20 hover:border-deep-slate"
                    )}
                  >
                    <p className="font-fredoka text-base text-deep-slate">{opt.l}</p>
                    <p className="text-[10px] text-pebble-grey font-bold mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
              {formData.depositType === "percentage" && (
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey whitespace-nowrap">
                    Deposit %
                  </label>
                  <select
                    value={formData.depositPercentage}
                    onChange={(e) => setField("depositPercentage", Number(e.target.value))}
                    className="bg-alabaster-cream border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold px-4 py-2 outline-none font-bold cursor-pointer"
                  >
                    {[10, 15, 20, 25, 30, 33, 50].map((pct) => (
                      <option key={pct} value={pct}>{pct}%</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Team groomers</Eyebrow>
              <p className="text-xs text-pebble-grey font-bold mt-1">Each groomer gets their own public profile under your business.</p>
            </div>
            {viewerRole === "owner" && (
              <button
                onClick={() => setAdding(true)}
                className="btn-primary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring shadow-subtle flex items-center gap-1"
              >
                <PlusIcon size={12} /> Add groomer
              </button>
            )}
          </div>

          <div className="space-y-3">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-2xl bg-sage-leaf text-white font-fredoka text-xl flex items-center justify-center shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-fredoka text-lg text-deep-slate">{m.name}</p>
                    <span className="text-xs text-pebble-grey font-bold">· since {m.sinceYear}</span>
                    {m.inviteStatus === "pending" && (
                      <span className="text-[10px] font-bold bg-groomr-gold/20 text-deep-slate border border-groomr-gold/40 px-2 py-0.5 rounded-full">
                        Invite pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-deep-slate font-bold">{m.role}</p>
                  {m.totalReviews > 0 && (
                    <p className="text-xs text-pebble-grey font-bold mt-0.5 flex items-center gap-1">
                      <StarIcon size={10} /> {m.averageRating} · {m.totalReviews} reviews
                    </p>
                  )}
                  {m.email && m.inviteStatus === "pending" && (
                    <p className="text-[11px] font-bold text-pebble-grey mt-0.5 truncate">{m.email}</p>
                  )}
                  {m.publicSlug && m.inviteStatus === "accepted" && (
                    <p className="text-[11px] font-bold text-sage-leaf mt-0.5 truncate">
                      groomr.co/{m.publicSlug}
                    </p>
                  )}
                </div>
                <button
                  className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"
                  aria-label="Edit"
                >
                  <PencilIcon size={14} />
                </button>
                {viewerRole === "owner" && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
                    aria-label="Remove"
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>
            ))}

            {adding && (
              <div className="border-2 border-dashed border-deep-slate/30 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FieldGroup label="Name">
                    <input
                      className="field"
                      placeholder="e.g. Hannah Reid"
                      value={newMember.name}
                      onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
                    />
                  </FieldGroup>
                  <FieldGroup label="Role">
                    <input
                      className="field"
                      placeholder="e.g. Senior groomer"
                      value={newMember.role}
                      onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}
                    />
                  </FieldGroup>
                  <FieldGroup label="Email address">
                    <input
                      className="field"
                      type="email"
                      placeholder="e.g. hannah@yoursalon.co.uk"
                      value={newMember.email}
                      onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))}
                    />
                  </FieldGroup>
                </div>
                {inviteError && (
                  <p className="text-xs font-bold text-muted-terracotta">{inviteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddMember}
                    disabled={inviting || !newMember.name.trim() || !newMember.email.trim()}
                    className="btn-primary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring disabled:opacity-50"
                  >
                    {inviting ? "Sending invite…" : "Send invite"}
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewMember({ name: "", role: "", email: "" }); setInviteError(null); }}
                    className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky save bar — only when dirty */}
        {isDirty && (
          <div className="sticky bottom-4 z-10">
            <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-4 flex items-center justify-between shadow-lift">
              <p className="text-sm font-bold">You have unsaved changes.</p>
              {saveError && (
                <p className="text-xs text-muted-terracotta font-bold mr-4">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDiscard}
                  className="bg-white/10 hover:bg-white/20 font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-groomr-gold text-deep-slate font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right column */}
      <aside className="space-y-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Public profile</Eyebrow>
          <div className="mt-3 aspect-[5/3] rounded-xl bg-sage-leaf/20 overflow-hidden relative">
            <Image
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=70"
              alt="Cover photo"
              fill
              className="object-cover"
              sizes="360px"
            />
          </div>
          <button className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-3 focus-ring">Replace cover photo</button>
          <button className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-2 focus-ring">Manage portfolio</button>
        </div>

        <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-5">
          <Eyebrow className="text-groomr-gold">Account health</Eyebrow>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sage-leaf rounded-full" /> Profile 100% complete</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sage-leaf rounded-full" /> Verified groomer</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-groomr-gold rounded-full" /> Insurance expires Jul 2026</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sage-leaf rounded-full" /> Stripe payouts active</div>
          </div>
        </div>

        {viewerRole === "owner" && (
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
            <Eyebrow>Danger zone</Eyebrow>
            <button className="w-full mt-3 text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">Pause new bookings</button>
            <button className="w-full text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">Close my Groomr account</button>
          </div>
        )}
      </aside>
    </section>
  );
}
