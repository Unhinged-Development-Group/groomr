"use client";

import { useState } from "react";
import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlusIcon, PencilIcon, TrashIcon, StarIcon, CheckIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";
import { saveGroomerProfile, saveServices, saveTeamMembers } from "@/app/actions/groomer";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function ProfileEditor({ profileData }: { profileData: any }) {
  const profile = profileData?.profile || {};
  const initialServices = profileData?.services || [];
  const initialTeam = profileData?.team || [];

  const [team, setTeam] = useState<any[]>(initialTeam.map((t: any) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    since: t.since_year ? String(t.since_year) : new Date().getFullYear().toString(),
    avatar: t.name.charAt(0).toUpperCase(),
    rating: t.average_rating || 0,
    reviews: t.total_reviews || 0,
    link: `groomr.co/${t.public_slug || t.name.toLowerCase().replace(/[^a-z]/g,"-")}`
  })));
  
  const [services, setServices] = useState<any[]>(initialServices.map((s: any) => ({
    name: s.name,
    duration: s.duration_minutes,
    price: s.price_pence ? s.price_pence / 100 : 0
  })));

  const [businessMode, setBusinessMode] = useState<"mobile" | "studio">(profile.is_mobile ? "mobile" : "studio");
  const [radius, setRadius] = useState(profile.service_radius || 5);
  const [bio, setBio] = useState(profile.bio || "");
  const [businessName, setBusinessName] = useState(profile.business_name || "");
  const [addressLine1, setAddressLine1] = useState(profile.address_line_1 || "");
  const [postcode, setPostcode] = useState(profile.postcode || "");
  
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "" });
  const [depositType, setDepositType] = useState<'none' | 'percentage' | 'full'>('none');
  const [depositPercentage, setDepositPercentage] = useState(10);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaveSuccess(false);

    const profileUpdates = {
      business_name: businessName,
      bio,
      is_mobile: businessMode === "mobile",
      is_studio: businessMode === "studio",
      service_radius: businessMode === "mobile" ? radius : null,
      address_line_1: businessMode === "studio" ? addressLine1 : null,
      postcode: businessMode === "studio" ? postcode : null,
    };

    const serviceUpdates = services.map(s => ({
      name: s.name,
      duration_minutes: s.duration,
      price_pence: Math.round(s.price * 100)
    }));

    const teamUpdates = team.map(t => ({
      name: t.name,
      role: t.role,
      since_year: parseInt(t.since) || new Date().getFullYear(),
      public_slug: t.link.split('groomr.co/')[1] || null
    }));

    await Promise.all([
      saveGroomerProfile(profileUpdates),
      saveServices(serviceUpdates),
      saveTeamMembers(teamUpdates)
    ]);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function addMember() {
    if (!newMember.name.trim()) return;
    const slug = newMember.name.toLowerCase().replace(/[^a-z]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
    setTeam(t => [...t, {
      id: "t" + (t.length + 1),
      name: newMember.name,
      role: newMember.role || "Groomer",
      since: "2026",
      avatar: newMember.name.charAt(0).toUpperCase(),
      rating: 0,
      reviews: 0,
      link: `groomr.co/${slug}-at-wagington`,
    }]);
    setNewMember({ name: "", role: "" });
    setAdding(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border border-pebble-grey/20 rounded-[20px] p-4 lg:px-6">
        <p className="text-sm font-bold text-deep-slate">Manage your public profile and settings</p>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary font-nunito font-bold px-6 py-2 rounded-full text-sm focus-ring flex items-center gap-2"
        >
          {isSaving ? "Saving..." : saveSuccess ? <><CheckIcon size={16} /> Saved</> : "Save changes"}
        </button>
      </div>

      <section className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Business basics */}
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <Eyebrow>Business basics</Eyebrow>
              <button className="text-xs font-bold text-deep-slate text-link">Preview public profile →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldGroup label="Business name"><input className="field" value={businessName} onChange={e => setBusinessName(e.target.value)} /></FieldGroup>
              <FieldGroup label="Owner / lead"><input className="field" defaultValue={profileData?.profile?.user_id || "Owner"} disabled /></FieldGroup>
            </div>
          <div className="mt-4">
            <FieldGroup label="Bio (max 280 chars)">
              <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 280))} className="field min-h-[100px]" />
              <p className="text-[10px] font-bold text-pebble-grey mt-1">{bio.length}/280</p>
            </FieldGroup>
          </div>
        </div>

        {/* Mode + radius */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <Eyebrow>How you operate</Eyebrow>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {([
              { k:"mobile", l:"Mobile (we drive)", sub:"You travel to clients" },
              { k:"studio", l:"Studio (clients come to us)", sub:"Fixed location" },
            ] as const).map(m => (
              <button key={m.k} onClick={() => setBusinessMode(m.k)}
                className={cn("text-left rounded-2xl p-4 border-2 transition-colors focus-ring", businessMode === m.k ? "border-deep-slate bg-alabaster-cream" : "border-pebble-grey/20 hover:border-deep-slate")}>
                <p className="font-fredoka text-lg text-deep-slate">{m.l}</p>
                <p className="text-xs text-pebble-grey font-bold mt-1">{m.sub}</p>
              </button>
            ))}
          </div>
          {businessMode === "mobile" && (
            <div className="mt-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <div className="flex justify-between items-baseline">
                <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf">Service radius</p>
                <p className="font-fredoka text-2xl text-deep-slate">{radius} mi</p>
              </div>
              <input type="range" min="1" max="20" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full mt-2 accent-deep-slate" />
              <div className="flex justify-between text-[10px] font-bold text-pebble-grey mt-1"><span>1 mi</span><span>20 mi</span></div>
            </div>
          )}
          {businessMode === "studio" && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldGroup label="Studio address"><input className="field" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="14 Mare Street, E8" /></FieldGroup>
              <FieldGroup label="Postcode"><input className="field" value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="E8 4RP" /></FieldGroup>
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Services &amp; pricing</Eyebrow>
            <button onClick={() => setServices(s => [...s, { name: "New service", duration: 30, price: 20 }])}
              className="btn-secondary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring flex items-center gap-1">
              <PlusIcon size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_100px_40px] gap-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
              <span>Service</span><span>Duration</span><span>Price</span><span />
            </div>
            {services.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_100px_40px] gap-3 items-center">
                <input className="field" value={s.name}
                  onChange={e => setServices(arr => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <div className="relative">
                  <input className="field pr-10" type="number" value={s.duration}
                    onChange={e => setServices(arr => arr.map((x, j) => j === i ? { ...x, duration: Number(e.target.value) } : x))} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">min</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">£</span>
                  <input className="field pl-7" type="number" value={s.price}
                    onChange={e => setServices(arr => arr.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} />
                </div>
                <button onClick={() => setServices(arr => arr.filter((_, j) => j !== i))}
                  className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring" aria-label="Remove">
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
                { k: "none" as const,       l: "No deposit",       sub: "Pay on the day" },
                { k: "percentage" as const, l: "% Deposit",        sub: "Upfront %"      },
                { k: "full" as const,       l: "Full pre-payment", sub: "100% at booking"},
              ]).map((opt) => (
                <button key={opt.k} onClick={() => setDepositType(opt.k)}
                  className={cn(
                    "text-left rounded-2xl p-3 border-2 transition-colors focus-ring",
                    depositType === opt.k
                      ? "border-deep-slate bg-alabaster-cream"
                      : "border-pebble-grey/20 hover:border-deep-slate"
                  )}
                >
                  <p className="font-fredoka text-base text-deep-slate">{opt.l}</p>
                  <p className="text-[10px] text-pebble-grey font-bold mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
            {depositType === "percentage" && (
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey whitespace-nowrap">
                  Deposit %
                </label>
                <select value={depositPercentage} onChange={e => setDepositPercentage(Number(e.target.value))}
                  className="bg-alabaster-cream border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold px-4 py-2 outline-none font-bold cursor-pointer">
                  {[10, 15, 20, 25, 30, 33, 50].map(pct => (
                    <option key={pct} value={pct}>{pct}%</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Team */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Team groomers</Eyebrow>
              <p className="text-xs text-pebble-grey font-bold mt-1">Each groomer gets their own public profile under your business.</p>
            </div>
            <button onClick={() => setAdding(true)}
              className="btn-primary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring shadow-subtle flex items-center gap-1">
              <PlusIcon size={12} /> Add groomer
            </button>
          </div>
          <div className="space-y-3">
            {team.map(m => (
              <div key={m.id} className="flex items-center gap-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-2xl bg-sage-leaf text-white font-fredoka text-xl flex items-center justify-center shrink-0">
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-fredoka text-lg text-deep-slate">{m.name}</p>
                    <span className="text-xs text-pebble-grey font-bold">· since {m.since}</span>
                  </div>
                  <p className="text-xs text-deep-slate font-bold">{m.role}</p>
                  {m.reviews > 0 && (
                    <p className="text-xs text-pebble-grey font-bold mt-0.5 flex items-center gap-1">
                      <StarIcon size={10} /> {m.rating} · {m.reviews} reviews
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-sage-leaf mt-0.5 truncate">{m.link}</p>
                </div>
                <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring" aria-label="Edit">
                  <PencilIcon size={14} />
                </button>
                <button onClick={() => setTeam(t => t.filter(x => x.id !== m.id))}
                  className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring" aria-label="Remove">
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}

            {adding && (
              <div className="border-2 border-dashed border-deep-slate/30 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <FieldGroup label="Name">
                  <input className="field" placeholder="e.g. Hannah Reid" value={newMember.name} onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Role">
                  <input className="field" placeholder="e.g. Senior groomer" value={newMember.role} onChange={e => setNewMember(m => ({ ...m, role: e.target.value }))} />
                </FieldGroup>
                <div className="flex gap-2">
                  <button onClick={addMember} className="btn-primary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring">Add</button>
                  <button onClick={() => { setAdding(false); setNewMember({ name: "", role: "" }); }} className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
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
          <button className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-2 focus-ring">Manage portfolio (4)</button>
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

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Danger zone</Eyebrow>
          <button className="w-full mt-3 text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">Pause new bookings</button>
          <button className="w-full text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">Close my Groomr account</button>
        </div>
      </aside>
    </section>
    </div>
  );
}
