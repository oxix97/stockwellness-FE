import { LucideIcon } from "lucide-react";

interface SectionProps {
  /** 섹션 제목 */
  title: string;
  /** 아이콘 (Lucide 아이콘 컴포넌트 또는 이모지 문자열) */
  icon?: LucideIcon | string;
  /** 섹션 내부 콘텐츠 */
  children: React.ReactNode;
  /** 추가 스타일 클래스 */
  className?: string;
}

/**
 * 제목과 아이콘을 포함한 공통 섹션 레이아웃 컴포넌트
 */
export function Section({ title, icon: Icon, children, className = "" }: SectionProps) {
  return (
    <div className={`px-6 pb-8 ${className}`}>
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        {Icon && (
          typeof Icon === "string" ? (
            <span className="text-2xl">{Icon}</span>
          ) : (
            <Icon className="w-6 h-6 text-primary" />
          )
        )}
        <h2 className="text-foreground font-bold text-xl">
          {title}
        </h2>
      </div>
      {/* 섹션 본문 */}
      {children}
    </div>
  );
}
