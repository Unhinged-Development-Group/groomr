"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SearchIcon, CloseIcon, ChevronRightIcon, CalendarIcon, MessageIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";

interface Client {
  id: string; // owner_id
  dog: string;
  breed: string;
  owner: string;
  visits: number;
  last: string;
  spend: number;
  regular: boolean;
  note: string;
  phone: string;
  email: string;
  joined: string;
  coat: string;
}

type SortKey = "dog" | "owner" | "visits" | "last" | "spend";

function SortHead({ k, label, align = "right", sort, onSort }: {
  k: SortKey; label: string; align?: "left" | "right";
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  return (
    <button onClick={() => onSort(k)}
      className={cn("inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors focus-ring rounded", active ? "text-deep-slate" : "text-pebble-grey hover:text-deep-slate", align === "right" ? "justify-end w-full" : "")}>
      {label}
      <span className="inline-flex flex-col text-[8px] leading-[8px]" aria-hidden>
        <span className={active && sort.dir === "asc" ? "text-deep-slate" : "text-pebble-grey/40"}>▲</span>
        <span className={active && sort.dir === "desc" ? "text-deep-slate" : "text-pebble-grey/40"}>▼</span>
      </span>
    </button>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">{label}</p>
      <p className="text-sm font-bold text-deep-slate mt-1 break-words">{value}</p>
    </div>
  );
}

function ClientModal({ client, onClose }: { client: Client | null; onClose: () => void }) {
  if (!client) return null;
  return (
    <Modal open={!!client} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sage-leaf text-white font-fredoka text-2xl flex items-center justify-center shrink-0">
            {client.dog.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-fredoka text-3xl text-deep-slate">{client.dog}</h2>
              {client.regular && <Badge tone="gold">Regular</Badge>}
            </div>
            <p className="text-sm text-pebble-grey font-bold mt-1">{client.breed} · {client.coat}</p>
            <p className="text-sm text-deep-slate font-bold mt-0.5">Owner: {client.owner}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4 text-center">
            <p className="font-fredoka text-2xl text-deep-slate">{client.visits}</p>
            <p className="text-xs font-bold text-pebble-grey mt-1">Visits</p>
          </div>
          <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4 text-center">
            <p className="font-fredoka text-2xl text-deep-slate">{client.last}</p>
            <p className="text-xs font-bold text-pebble-grey mt-1">Last visit</p>
          </div>
          <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4 text-center">
            <p className="font-fredoka text-2xl text-deep-slate">£{client.spend}</p>
            <p className="text-xs font-bold text-pebble-grey mt-1">Lifetime</p>
          </div>
        </div>

        <div className="bg-white border border-pebble-grey/15 rounded-2xl p-4">
          <Eyebrow>Grooming notes</Eyebrow>
          <p className="text-sm text-deep-slate mt-2 italic">&quot;{client.note}&quot;</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ContactRow label="Phone"  value={client.phone} />
          <ContactRow label="Email"  value={client.email} />
          <ContactRow label="Joined" value={client.joined} />
          <ContactRow label="Status" value={client.regular ? "Regular client" : "New / occasional"} />
        </div>

        <div className="bg-white border border-pebble-grey/15 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-pebble-grey/10"><Eyebrow>Recent visits</Eyebrow></div>
          {[
            { d: "12 Apr", svc: "Full Groom",   g: "Lola",   price: 58 },
            { d: "29 Mar", svc: "Bath & Brush",  g: "Marcus", price: 38 },
            { d: "15 Feb", svc: "Full Groom",   g: "Lola",   price: 58 },
          ].map((v, i) => (
            <div key={i} className={`grid grid-cols-[80px_1fr_auto_auto] gap-3 px-4 py-3 items-center ${i ? "border-t border-pebble-grey/10" : ""}`}>
              <span className="font-bold text-sm text-deep-slate">{v.d}</span>
              <span className="text-sm text-deep-slate">{v.svc}</span>
              <span className="text-xs text-pebble-grey font-bold">w/ {v.g}</span>
              <span className="font-fredoka text-deep-slate">£{v.price}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2">
            <CalendarIcon size={16} /> Book again
          </button>
          <button className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2">
            <MessageIcon size={16} /> Message
          </button>
          <button className="font-nunito font-bold text-deep-slate hover:text-muted-terracotta transition-colors px-5 py-2.5 rounded-full text-sm focus-ring">
            Edit notes
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ClientsView({ appointments }: { appointments: any[] }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "last", dir: "desc" });
  const [openClient, setOpenClient] = useState<Client | null>(null);

  function sortBy(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  }

  // Calculate clients from appointments
  const clientsMap = new Map<string, Client>();
  
  appointments.forEach(a => {
    if (a.status === 'cancelled') return;
    const clientId = a.owner_id + "-" + a.dog_id;
    const d = new Date(a.scheduled_at);
    
    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        id: clientId,
        dog: a.dogs?.name || "Dog",
        breed: a.dogs?.breed || "Mixed",
        owner: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name || ""}`.trim() : "Owner",
        visits: 0,
        last: "",
        spend: 0,
        regular: false,
        note: a.owner_notes || "",
        phone: a.profiles?.phone_number || "Unknown",
        email: "Unknown",
        joined: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        coat: a.dogs?.coat || "Unknown",
      });
    }
    
    const c = clientsMap.get(clientId)!;
    c.visits += 1;
    c.spend += (a.service_snapshot_price || 0) / 100;
    
    const lastDate = c.last ? new Date(c.last) : new Date(0);
    if (d > lastDate) {
      c.last = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    if (c.visits > 1) {
      c.regular = true;
    }
  });

  const allClients = Array.from(clientsMap.values());

  const q = query.toLowerCase().trim();
  let rows = allClients.filter(c => filter === "All" ? true : filter === "Regulars" ? c.regular : !c.regular);
  if (q) rows = rows.filter(c => c.dog.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q));

  rows = [...rows].sort((a, b) => {
    let av: string | number = 0;
    let bv: string | number = 0;
    if (sort.key === "dog")    { av = a.dog.toLowerCase();   bv = b.dog.toLowerCase(); }
    if (sort.key === "owner")  { av = a.owner.toLowerCase(); bv = b.owner.toLowerCase(); }
    if (sort.key === "visits") { av = a.visits;              bv = b.visits; }
    if (sort.key === "last")   { av = a.last === "—" ? 0 : new Date(a.last).getTime(); bv = b.last === "—" ? 0 : new Date(b.last).getTime(); }
    if (sort.key === "spend")  { av = a.spend;               bv = b.spend; }
    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ?  1 : -1;
    return 0;
  });

  return (
    <section className="space-y-5">
      <div>
        <Eyebrow>Your pack</Eyebrow>
        <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{allClients.length} dogs · {allClients.filter(c => c.regular).length} regulars</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px] bg-white rounded-full p-1.5 flex items-center border border-pebble-grey/20 focus-within:ring-2 focus-within:ring-groomr-gold transition-shadow">
          <span className="pl-3 text-pebble-grey"><SearchIcon size={18} /></span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by dog or owner name…"
            className="flex-1 bg-transparent px-3 py-2 text-sm font-bold text-deep-slate placeholder:text-pebble-grey/70 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-pebble-grey hover:text-deep-slate transition-colors px-3" aria-label="Clear">
              <CloseIcon size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {["All","Regulars","New"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring border", filter === f ? "bg-deep-slate text-alabaster-cream border-deep-slate" : "bg-white text-deep-slate border-pebble-grey/20 hover:border-deep-slate/40")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-5 py-3 bg-alabaster-cream border-b border-pebble-grey/15">
          <SortHead k="dog" label="Dog & owner" align="left" sort={sort} onSort={sortBy} />
          <SortHead k="visits" label="Visits" sort={sort} onSort={sortBy} />
          <SortHead k="last"   label="Last"   sort={sort} onSort={sortBy} />
          <SortHead k="spend"  label="Lifetime" sort={sort} onSort={sortBy} />
          <span />
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="font-fredoka text-lg text-deep-slate">No matches.</p>
            <p className="text-sm text-pebble-grey font-bold">Try a different name.</p>
          </div>
        )}
        {rows.map((c, i) => (
          <button key={c.id} onClick={() => setOpenClient(c)}
            className={`w-full text-left grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-5 py-4 items-center hover:bg-alabaster-cream transition-colors focus-ring ${i ? "border-t border-pebble-grey/10" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sage-leaf/20 flex items-center justify-center font-fredoka text-deep-slate shrink-0">
                {c.dog.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-fredoka text-deep-slate">{c.dog}</p>
                  {c.regular && <Badge tone="gold">Regular</Badge>}
                </div>
                <p className="text-xs text-pebble-grey font-bold truncate">{c.breed} · {c.owner.split(" (")[0]}</p>
                {c.note && <p className="text-xs text-sage-leaf italic truncate mt-0.5">&quot;{c.note}&quot;</p>}
              </div>
            </div>
            <span className="text-right font-fredoka text-deep-slate">{c.visits}</span>
            <span className="text-right text-sm text-pebble-grey font-bold">{c.last}</span>
            <span className="text-right font-fredoka text-deep-slate">£{c.spend}</span>
            <span className="justify-self-end rounded-full p-2 bg-alabaster-cream border border-pebble-grey/20 text-deep-slate">
              <ChevronRightIcon size={16} />
            </span>
          </button>
        ))}
      </div>

      <ClientModal client={openClient} onClose={() => setOpenClient(null)} />
    </section>
  );
}
