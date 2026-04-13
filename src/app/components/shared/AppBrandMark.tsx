import { Sprout, TrendingUp } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

interface AppBrandMarkProps {
  className?: string;
  compact?: boolean;
}

export function AppBrandMark({ className, compact = false }: AppBrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_16%,var(--color-card)),var(--color-card))] shadow-[0_14px_28px_-20px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
        <TrendingUp className="absolute h-5 w-5 translate-x-[2px] translate-y-[1px] text-foreground/70" />
        <Sprout className="absolute h-4 w-4 -translate-x-[7px] -translate-y-[6px] text-primary" />
      </div>
      {!compact && (
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground">Stockwellness</p>
          <p className="text-[11px] text-muted-foreground">Grow your investing garden</p>
        </div>
      )}
    </div>
  );
}
