"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Faq {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqs: Faq[];
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="bg-white border border-pebble-grey/20 rounded-[16px] overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus-ring"
          >
            <span className="font-fredoka text-lg text-deep-slate">{faq.q}</span>
            <ChevronDown
              size={18}
              className={cn(
                "text-pebble-grey shrink-0 transition-transform duration-300",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-5 text-pebble-grey leading-relaxed font-nunito">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
