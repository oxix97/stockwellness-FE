import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/app/components/ui/utils";
import { Skeleton } from "@/app/components/ui";

interface HomeCardProps extends HTMLMotionProps<"button"> {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  displayValue?: ReactNode;
  description?: ReactNode;
  surfaceDecoration?: ReactNode;
  onTap?: () => void;
}

/**
 * Task #74 — 홈 화면 가로 스크롤 카드 공통 컴포넌트
 */
export function HomeCard({
  title,
  icon,
  badge,
  displayValue,
  description,
  surfaceDecoration,
  onTap,
  className,
  ...props
}: HomeCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={cn(
        "relative w-full min-w-[var(--mobile-scroll-card-width)] overflow-hidden rounded-[var(--mobile-card-radius)] border p-[var(--mobile-card-padding)] text-left lg:min-w-0 lg:rounded-[24px] lg:p-4",
        "border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]",
        "shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]",
        "dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(28,28,30,0.98),rgba(18,18,20,0.94))]",
        "dark:shadow-[0_14px_30px_-20px_rgba(0,0,0,0.6)]",
        "flex h-[var(--mobile-scroll-card-height)] flex-col justify-between text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_30px_-22px_rgba(15,23,42,0.35)]",
        "dark:hover:border-white/12 dark:hover:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.72)]",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-4 top-0 z-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/12" />
      {surfaceDecoration && (
        <div className="pointer-events-none absolute inset-0 z-0">
          {surfaceDecoration}
        </div>
      )}
      <div className="relative z-10 flex items-start justify-between w-full">
        {icon ? <span className="text-[1.75rem] flex-shrink-0 min-[408px]:text-3xl">{icon}</span> : <span />}
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      <div className="relative z-10 w-full overflow-hidden">
        <p className="text-foreground font-semibold text-[15px] leading-tight truncate">{title}</p>
        <div className="mt-1 flex flex-col gap-1">
          {displayValue && (
            <div className="text-[15px] font-semibold tabular-nums">
              {displayValue}
            </div>
          )}
          {description && (
            <div className="line-clamp-2 text-xs leading-[1.45] text-muted-foreground">
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * 카드 형태의 스켈레톤 로더
 */
export function HomeCardSkeleton() {
  return (
    <div className="relative flex h-[var(--mobile-scroll-card-height)] min-w-[var(--mobile-scroll-card-width)] flex-col justify-between overflow-hidden rounded-[var(--mobile-card-radius)] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-[var(--mobile-card-padding)] shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(28,28,30,0.98),rgba(18,18,20,0.94))] dark:shadow-[0_14px_30px_-20px_rgba(0,0,0,0.6)] lg:min-w-0 lg:rounded-[24px] lg:p-4">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/12" />
      <div className="flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/8" />
        <Skeleton className="h-5 w-16 rounded-full bg-black/5 dark:bg-white/8" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-3/4 rounded-full bg-black/5 dark:bg-white/8" />
        <Skeleton className="h-4 w-1/2 rounded-full bg-black/5 dark:bg-white/8" />
      </div>
    </div>
  );
}
