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
}

/**
 * 페이지 상단 공통 헤더 컴포넌트
 */
export function PageHeader({ title, showBack, showNotifications, logo, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn("bg-background/85 backdrop-blur-md px-4 py-3 flex items-center border-b border-border min-h-[68px] sticky top-0 z-30", className)}>
      {/* 뒤로 가기 버튼 */}
      {showBack && (
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 rounded-full hover:bg-secondary">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* 앱 서비스 로고 */}
      {logo && (
        <AppBrandMark className="mr-auto" />
      )}

      {/* 페이지 타이틀 */}
      {title && (
        <div className={`flex-1 ${showBack ? "text-center pr-10" : ""} text-foreground font-bold text-xl`}>
          {title}
        </div>
      )}

      {/* 알림 버튼 */}
      {showNotifications && (
        <button className="p-2 -mr-2 ml-auto rounded-full hover:bg-secondary">
          <Bell className="w-6 h-6 text-foreground" />
        </button>
      )}
    </header>
  );
}
