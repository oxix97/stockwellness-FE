import { useNavigate } from "react-router";
import { ChevronLeft, Bell } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { AppBrandMark } from "./AppBrandMark";

interface PageHeaderProps {
  /** 헤더 제목 */
  title?: string;
  /** 뒤로 가기 버튼 표시 여부 */
  showBack?: boolean;
  /** 알림 아이콘 표시 여부 */
  showNotifications?: boolean;
  /** 로고(Stockwellness) 표시 여부 */
  logo?: boolean;
  /** 추가 스타일 클래스 */
  className?: string;
  /** 헤더 보조 설명 */
  description?: string;
  /** 우측 영역 */
  rightContent?: React.ReactNode;
}

/**
 * 페이지 상단 공통 헤더 컴포넌트
 */
export function PageHeader({ title, showBack, showNotifications, logo, className, description, rightContent }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn("sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl", className)}>
      <div className="page-shell page-content flex min-h-[var(--mobile-page-header-height)] items-center gap-3 py-2.5 md:min-h-[72px] md:py-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="rounded-full p-2 -ml-2 transition-colors hover:bg-secondary">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {logo && <AppBrandMark className="mr-auto" />}

        {(title || description) && (
          <div className="min-w-0 flex-1">
            {title && <div className="truncate text-[14px] font-bold text-foreground md:text-lg">{title}</div>}
            {description && <div className="truncate text-xs text-muted-foreground">{description}</div>}
          </div>
        )}

        {rightContent}

        {showNotifications && (
          <button className="ml-auto rounded-full p-2 transition-colors hover:bg-secondary">
            <Bell className="h-6 w-6 text-foreground" />
          </button>
        )}
      </div>
    </header>
  );
}
