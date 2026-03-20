import { Search, Bell } from "lucide-react";

interface AppBarProps {
  onSearchOpen: () => void;
}

/**
 * 전체 탭 공통 상단 앱바.
 * 로고 | 검색바(클릭 시 오버레이) | 알림 아이콘
 */
export function AppBar({ onSearchOpen }: AppBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-background/80 backdrop-blur-sm border-b border-border flex items-center gap-3 px-4">
      {/* 로고 */}
      <div className="shrink-0 w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm leading-none">S</span>
      </div>

      {/* 검색바 — 클릭 시 전체화면 오버레이 열기 */}
      <button
        onClick={onSearchOpen}
        className="flex-1 flex items-center gap-2 bg-secondary rounded-full h-9 px-3"
        aria-label="검색"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-sm">종목·티커 검색</span>
      </button>

      {/* 알림 */}
      <button className="shrink-0 p-1" aria-label="알림">
        <Bell className="w-5 h-5 text-foreground" />
      </button>
    </header>
  );
}
