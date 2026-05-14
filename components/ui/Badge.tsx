import { cn } from "@/lib/utils";

type BadgeTone = "sage" | "gold" | "terra" | "grey";

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  sage:  "bg-sage-leaf/10 text-deep-slate border-sage-leaf/20",
  gold:  "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
  terra: "bg-muted-terracotta/10 text-deep-slate border-muted-terracotta/30",
  grey:  "bg-pebble-grey/10 text-deep-slate border-pebble-grey/20",
};

export function Badge({ tone = "sage", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
