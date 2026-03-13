import { useNavigate } from "react-router";
import { ChevronLeft, Bell } from "lucide-react";

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
    <header className={`bg-card px-6 py-4 flex items-center border-b border-border min-h-[72px] ${className || ""}`}>
      {/* 뒤로 가기 버튼 */}
      {showBack && (
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* 앱 서비스 로고 */}
      {logo && (
        <div className="text-primary font-bold text-2xl mr-auto">
          Stockwellness
        </div>
      )}

      {/* 페이지 타이틀 */}
      {title && (
        <div className={`flex-1 ${showBack ? "text-center pr-10" : ""} text-foreground font-bold text-xl`}>
          {title}
        </div>
      )}

      {/* 알림 버튼 */}
      {showNotifications && (
        <button className="p-2 -mr-2 ml-auto">
          <Bell className="w-6 h-6 text-foreground" />
        </button>
      )}
    </header>
  );
}
