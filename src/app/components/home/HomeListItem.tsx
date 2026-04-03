import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/app/components/ui/utils";

/**
 * Task #71 — "Market Intelligence" 통합 디자인 언어 적용을 위한 공통 리스트 아이템
 */
interface HomeListItemProps extends HTMLMotionProps<"div"> {
  title: string;
  subtitle?: string;
  badges?: ReactNode[];
  rightContent?: ReactNode;
  bottomContent?: ReactNode;
  variant?: "default" | "active";
}

export function HomeListItem({
  title,
  subtitle,
  badges,
  rightContent,
  bottomContent,
  variant = "default",
  className,
  ...props
}: HomeListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group flex flex-col gap-2 p-4 bg-card rounded-2xl border border-border",
        "hover:bg-accent/5 hover:border-primary/20 transition-all duration-200",
        variant === "active" && "border-primary/30 bg-primary/5",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground truncate">{title}</span>
            {badges && badges.length > 0 && (
              <div className="flex gap-1">
                {badges.map((badge, idx) => (
                  <div key={idx} className="flex-shrink-0">
                    {badge}
                  </div>
                ))}
              </div>
            )}
          </div>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
        {rightContent && (
          <div className="flex-shrink-0 text-right">
            {rightContent}
          </div>
        )}
      </div>
      {bottomContent && (
        <div className="mt-1">
          {bottomContent}
        </div>
      )}
    </motion.div>
  );
}

/**
 * 캡슐형 배지 컴포넌트
 */
export function HomeBadge({
  children,
  className,
  opacity = 10,
}: {
  children: ReactNode;
  className?: string;
  opacity?: 10 | 20 | 30;
}) {
  const opacityClasses = {
    10: "bg-primary/10 text-primary",
    20: "bg-primary/20 text-primary",
    30: "bg-primary/30 text-primary font-semibold",
  };

  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
        opacityClasses[opacity],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * 일관된 디자인의 스켈레톤 로더
 */
import { Skeleton } from "@/app/components/ui";

export function HomeListItemSkeleton({ hasBottom = false }: { hasBottom?: boolean }) {
  return (
    <div className="p-4 bg-card rounded-2xl border border-border flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32 rounded-full" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      {hasBottom && <Skeleton className="h-1.5 w-full rounded-full" />}
    </div>
  );
}
