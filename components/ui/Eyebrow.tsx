import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "text-xs font-bold text-sage-leaf uppercase tracking-[0.15em] block",
        className
      )}
    >
      {children}
    </span>
  );
}
