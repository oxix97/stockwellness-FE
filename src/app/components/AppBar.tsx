import { Search, Bell } from "lucide-react";
import { Link } from "react-router";
import { AppBrandMark } from "@/app/components/shared";

/**
 * 전체 탭 공통 상단 앱바.
 * 로고 | 검색바(클릭 시 검색 탭으로 이동) | 알림 아이콘
 */
export function AppBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/82 px-4 backdrop-blur-md">
      <AppBrandMark compact className="shrink-0" />

      {/* 검색바 — 클릭 시 검색 탭으로 이동 */}
      <Link
        to="/search"
        className="flex h-10 flex-1 items-center gap-2 rounded-full bg-secondary px-3"
        aria-label="검색"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-sm">종목·티커 검색</span>
      </Link>

      {/* 알림 */}
      <button className="shrink-0 rounded-full p-2 hover:bg-secondary" aria-label="알림">
        <Bell className="w-5 h-5 text-foreground" />
      </button>
    </header>
  );
}
