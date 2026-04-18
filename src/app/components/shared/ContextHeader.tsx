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
  layout?: "adaptive" | "split";
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
  layout = "adaptive",
}: ContextHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--mobile-card-radius)] border px-[var(--mobile-header-padding-x)] py-[var(--mobile-header-padding-y)] shadow-[0_20px_40px_-28px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] md:rounded-[28px] md:px-6 md:py-6 xl:px-7",
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
            <div className="absolute -right-10 -top-8 h-24 w-24 rounded-full bg-primary/12 blur-2xl min-[408px]:h-28 min-[408px]:w-28" />
            <div className="absolute right-8 top-7 hidden h-20 w-20 rounded-full border border-primary/10 min-[408px]:block min-[408px]:h-24 min-[408px]:w-24" />
            <div className="absolute left-5 top-5 h-px w-20 bg-gradient-to-r from-primary/45 to-transparent min-[408px]:left-6 min-[408px]:top-6 min-[408px]:w-24" />
            <div className="absolute right-5 bottom-5 h-8 w-20 rounded-full bg-primary/6 blur-xl min-[408px]:right-6 min-[408px]:bottom-6 min-[408px]:h-10 min-[408px]:w-24" />
          </>
        )}
        {variant === "search" && (
          <>
            <div className="absolute right-5 top-5 hidden grid-cols-4 gap-1.5 opacity-35 min-[408px]:grid min-[408px]:gap-2 min-[408px]:opacity-40">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className="h-2 w-2 rounded-full bg-primary/30" />
              ))}
            </div>
            <div className="absolute left-0 top-14 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent min-[408px]:top-16" />
          </>
        )}
        {variant === "watch" && (
          <>
            <div className="absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-primary/10 blur-2xl min-[408px]:h-24 min-[408px]:w-24" />
            <div className="absolute right-4 top-5 h-14 w-14 rounded-2xl border border-primary/12 rotate-6 min-[408px]:h-16 min-[408px]:w-16" />
            <div className="absolute left-5 top-5 h-px w-14 bg-gradient-to-r from-primary/35 to-transparent min-[408px]:left-6 min-[408px]:top-6 min-[408px]:w-16" />
          </>
        )}
        {variant === "profile" && (
          <>
            <div className="absolute right-0 top-0 h-20 w-24 bg-gradient-to-bl from-primary/14 to-transparent min-[408px]:h-24 min-[408px]:w-28" />
            <div className="absolute right-6 top-5 h-12 w-12 rounded-full border border-primary/15 min-[408px]:right-8 min-[408px]:top-6 min-[408px]:h-14 min-[408px]:w-14" />
            <div className="absolute left-5 bottom-6 h-7 w-20 rounded-full bg-primary/6 blur-xl min-[408px]:left-6 min-[408px]:bottom-8 min-[408px]:h-8 min-[408px]:w-24" />
          </>
        )}
        {ornament}
      </div>
      <div
        className={cn(
          "flex flex-col gap-[var(--mobile-header-gap)] md:gap-5",
          layout === "split" ? "lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start" : "lg:flex-row lg:items-start lg:justify-between"
        )}
      >
        <div className="relative z-10 min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <div className="text-foreground">{title}</div>
          {description && (
            <div className="mt-2 max-w-[34rem] text-[13px] leading-[1.55] text-muted-foreground md:text-[15px]">{description}</div>
          )}
        </div>
        {actions && <div className="relative z-10 shrink-0 self-start lg:justify-self-end">{actions}</div>}
      </div>
      {footer && <div className={cn("relative z-10 mt-[var(--mobile-footer-gap)] md:mt-5", footerClassName)}>{footer}</div>}
    </section>
  );
}
