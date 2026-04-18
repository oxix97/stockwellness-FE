import { ReactNode } from "react";
import { Button } from "@/app/components/ui";
import { AppBrandMark } from "./AppBrandMark";

interface GardenEmptyStateProps {
  title: ReactNode;
  description: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: ReactNode;
}

export function GardenEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondary,
}: GardenEmptyStateProps) {
  return (
    <div className="rounded-[var(--mobile-card-radius)] border border-border bg-card px-[var(--mobile-header-padding-x)] py-[calc(var(--mobile-header-padding-y)*1.55)] text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)] md:rounded-[28px] md:px-6 md:py-10">
      <div className="mx-auto mb-4 flex w-fit justify-center md:mb-5">
        <AppBrandMark compact />
      </div>
      <div className="mx-auto max-w-[18rem]">
        <p className="text-lg font-bold leading-snug text-foreground">{title}</p>
        <p className="mt-2 text-sm leading-[1.55] text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 rounded-2xl px-5 md:mt-6">
          {actionLabel}
        </Button>
      )}
      {secondary && <div className="mt-4 text-xs text-muted-foreground">{secondary}</div>}
    </div>
  );
}
