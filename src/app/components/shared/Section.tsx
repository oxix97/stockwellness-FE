import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/app/components/ui/utils";

interface SectionProps {
  /** 섹션 제목 */
  title: string;
  /** 섹션 보조 설명 */
  subtitle?: string;
  /** 아이콘 (Lucide 아이콘 컴포넌트 또는 이모지 문자열) */
  icon?: LucideIcon | string;
  /** 섹션 내부 콘텐츠 */
  children: React.ReactNode;
  /** 추가 스타일 클래스 */
  className?: string;
  /** 우측 상단 추가 콘텐츠 (예: 전체보기 링크) */
  rightContent?: React.ReactNode;
  /** 전체보기 링크 경로 */
  href?: string;
  /** 공통 section container layout */
  layout?: "default" | "wide";
}

/**
 * 제목과 아이콘을 포함한 공통 섹션 레이아웃 컴포넌트
 */
export function Section({ 
  title, 
  subtitle,
  icon: Icon, 
  children, 
  className = "",
  rightContent,
  href,
  layout = "default",
}: SectionProps) {
  return (
    <section
      className={cn(
        "page-shell pb-[var(--section-gap-mobile)] md:pb-10",
        layout === "default" ? "page-content" : "max-w-[1320px]",
        className
      )}
    >
      {/* 섹션 헤더 */}
      <div className="mb-3.5 flex items-start justify-between gap-3 md:mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon && (
              typeof Icon === "string" ? (
                <span className="text-2xl">{Icon}</span>
              ) : (
                <div className="rounded-lg bg-primary/8 p-1.5 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
              )
            )}
            <h2 className="text-foreground text-[17px] font-bold tracking-tight md:text-xl">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-[13px] leading-[1.55] text-muted-foreground md:text-[15px]">{subtitle}</p>
          )}
        </div>
        
        {href ? (
          <Link 
            to={href} 
            className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            전체보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          rightContent && (
            <div className="shrink-0">
              {rightContent}
            </div>
          )
        )}
      </div>
      {/* 섹션 본문 */}
      {children}
    </section>
  );
}
