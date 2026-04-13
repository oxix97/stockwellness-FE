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
    <div className="rounded-[28px] border border-border bg-card px-6 py-10 text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)]">
      <div className="mx-auto mb-5 flex w-fit justify-center">
        <AppBrandMark compact />
      </div>
      <div className="mx-auto max-w-[18rem]">
        <p className="text-lg font-bold leading-snug text-foreground">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 rounded-2xl px-5">
          {actionLabel}
        </Button>
      )}
      {secondary && <div className="mt-4 text-xs text-muted-foreground">{secondary}</div>}
    </div>
  );
}
