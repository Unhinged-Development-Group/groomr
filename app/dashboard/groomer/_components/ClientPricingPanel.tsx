"use client";

import { useState, useEffect, useTransition } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckIcon } from "@/components/ui/GroomrIcons";
import { getClientPricing, saveClientPricing } from "@/app/actions/client-settings";
import type { ServiceRow } from "@/types/groomer-dashboard";

interface Props {
  ownerId: string;
  services: ServiceRow[];
}

export function ClientPricingPanel({ ownerId, services }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountPct, setDiscountPct] = useState<string>("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Load existing pricing when panel is expanded
  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    getClientPricing(ownerId).then((data) => {
      setDiscountPct(data.discountPercentage != null ? String(data.discountPercentage) : "");
      const map: Record<string, string> = {};
      data.serviceOverrides.forEach(({ serviceId, overridePricePence }) => {
        map[serviceId] = (overridePricePence / 100).toFixed(2);
      });
      setOverrides(map);
      setLoading(false);
    });
  }, [expanded, ownerId]);

  function handleSave() {
    const discountPercentage = discountPct !== "" ? Number(discountPct) : null;
    const serviceOverrides = services
      .filter((s) => s.id && overrides[s.id!] !== undefined && overrides[s.id!] !== "")
      .map((s) => ({
        serviceId: s.id!,
        overridePricePence: Math.round(parseFloat(overrides[s.id!]) * 100),
      }));

    startTransition(async () => {
      const result = await saveClientPricing({ ownerProfileId: ownerId, discountPercentage, serviceOverrides });
      if ("ok" in result) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="bg-white border border-pebble-grey/15 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-alabaster-cream transition-colors focus-ring"
      >
        <Eyebrow>Custom pricing</Eyebrow>
        <span className="text-xs font-bold text-pebble-grey">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-pebble-grey/10 pt-4">
          {loading ? (
            <p className="text-sm text-pebble-grey font-bold">Loading…</p>
          ) : (
            <>
              {/* Blanket discount */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-2">
                  Blanket discount
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    placeholder="0"
                    className="field w-24 text-center font-bold"
                  />
                  <span className="text-sm font-bold text-deep-slate">% off all services</span>
                </div>
                <p className="text-xs text-pebble-grey mt-1">0 = no discount · 100 = free</p>
              </div>

              {/* Per-service overrides */}
              {services.filter((s) => s.id).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-2">
                    Per-service fixed price
                  </p>
                  <p className="text-xs text-pebble-grey mb-3">
                    Overrides the discount above. Leave blank to use standard/discount price.
                  </p>
                  <div className="space-y-2">
                    {services
                      .filter((s) => s.id)
                      .map((s) => (
                        <div key={s.id} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-deep-slate flex-1 min-w-0 truncate">
                            {s.name}
                          </span>
                          <span className="text-xs text-pebble-grey">
                            £{(s.price / 100).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-pebble-grey">£</span>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={overrides[s.id!] ?? ""}
                              onChange={(e) =>
                                setOverrides((prev) => ({
                                  ...prev,
                                  [s.id!]: e.target.value,
                                }))
                              }
                              placeholder="—"
                              className="field w-20 text-center font-bold"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={pending}
                className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2"
              >
                {saved ? (
                  <>
                    <CheckIcon size={14} /> Saved
                  </>
                ) : pending ? (
                  "Saving…"
                ) : (
                  "Save pricing"
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
