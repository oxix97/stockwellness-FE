import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/app/components/ui/utils";

interface SectionProps {
  /** 섹션 제목 */
  title: string;
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
}

/**
 * 제목과 아이콘을 포함한 공통 섹션 레이아웃 컴포넌트
 */
export function Section({ 
  title, 
  icon: Icon, 
  children, 
  className = "",
  rightContent,
  href
}: SectionProps) {
  return (
    <section className={cn("px-4 pb-8", className)}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && (
            typeof Icon === "string" ? (
              <span className="text-2xl">{Icon}</span>
            ) : (
              <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                <Icon className="w-5 h-5" />
              </div>
            )
          )}
          <h2 className="text-foreground font-bold text-xl tracking-tight">
            {title}
          </h2>
        </div>
        
        {href ? (
          <Link 
            to={href} 
            className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
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
