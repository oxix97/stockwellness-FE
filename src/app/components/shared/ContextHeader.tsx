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
        "relative overflow-hidden rounded-[var(--mobile-card-radius)] border border-border bg-card px-[var(--mobile-header-padding-x)] py-[var(--mobile-header-padding-y)] shadow-[0_20px_40px_-28px_rgba(15,23,42,0.12)] md:rounded-[28px] md:px-6 md:py-6 xl:px-7",
        variant === "default" &&
          "border-border bg-card",
        variant === "market" &&
          "border-border bg-card",
        variant === "search" &&
          "border-border bg-card",
        variant === "watch" &&
          "border-border bg-card",
        variant === "profile" &&
          "border-border bg-card",
        className
      )}
    >
      {ornament && <div className="pointer-events-none absolute inset-0">{ornament}</div>}
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
