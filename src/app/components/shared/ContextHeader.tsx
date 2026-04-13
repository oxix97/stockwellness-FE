import { ReactNode } from "react";
import { cn } from "@/app/components/ui/utils";

interface ContextHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  variant?: "default" | "market" | "search" | "watch" | "profile";
  ornament?: ReactNode;
  footerClassName?: string;
}

export function ContextHeader({
  eyebrow,
  title,
  description,
  actions,
  footer,
  className,
  variant = "default",
  ornament,
  footerClassName,
}: ContextHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] border px-5 py-5 shadow-[0_20px_40px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]",
        variant === "default" &&
          "border-primary/15 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_16%,var(--color-card)),color-mix(in_srgb,var(--color-accent)_70%,var(--color-card))_60%,var(--color-card))] dark:border-primary/20",
        variant === "market" &&
          "border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_18%,var(--color-card)),color-mix(in_srgb,var(--color-accent)_72%,var(--color-card))_56%,var(--color-card))]",
        variant === "search" &&
          "border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-card)_96%,var(--color-primary)_4%),color-mix(in_srgb,var(--color-secondary)_88%,var(--color-card))_45%,var(--color-card))]",
        variant === "watch" &&
          "border-primary/15 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-card)),color-mix(in_srgb,var(--color-card)_94%,var(--color-accent)_6%)_60%,var(--color-card))]",
        variant === "profile" &&
          "border-primary/18 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_14%,var(--color-card)),color-mix(in_srgb,var(--color-accent)_76%,var(--color-card))_58%,var(--color-card))]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        {variant === "market" && (
          <>
            <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-primary/12 blur-2xl" />
            <div className="absolute right-10 top-8 h-24 w-24 rounded-full border border-primary/10" />
            <div className="absolute left-6 top-6 h-px w-24 bg-gradient-to-r from-primary/45 to-transparent" />
            <div className="absolute right-6 bottom-6 h-10 w-24 rounded-full bg-primary/6 blur-xl" />
          </>
        )}
        {variant === "search" && (
          <>
            <div className="absolute right-6 top-6 grid grid-cols-4 gap-2 opacity-40">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className="h-2 w-2 rounded-full bg-primary/30" />
              ))}
            </div>
            <div className="absolute left-0 top-16 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
          </>
        )}
        {variant === "watch" && (
          <>
            <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute right-4 top-5 h-16 w-16 rounded-2xl border border-primary/12 rotate-6" />
            <div className="absolute left-6 top-6 h-px w-16 bg-gradient-to-r from-primary/35 to-transparent" />
          </>
        )}
        {variant === "profile" && (
          <>
            <div className="absolute right-0 top-0 h-24 w-28 bg-gradient-to-bl from-primary/14 to-transparent" />
            <div className="absolute right-8 top-6 h-14 w-14 rounded-full border border-primary/15" />
            <div className="absolute left-6 bottom-8 h-8 w-24 rounded-full bg-primary/6 blur-xl" />
          </>
        )}
        {ornament}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="relative z-10 min-w-0">
          {eyebrow && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <div className="text-foreground">{title}</div>
          {description && (
            <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>
          )}
        </div>
        {actions && <div className="relative z-10 shrink-0">{actions}</div>}
      </div>
      {footer && <div className={cn("relative z-10 mt-4", footerClassName)}>{footer}</div>}
    </section>
  );
}
