import { Suspense } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { Home, Star, Wallet, User, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMe } from "@/hooks/use-member";
import { Skeleton } from "@/app/components/ui";
import { AppBrandMark } from "@/app/components/shared";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "홈", size: 24 },
  { path: "/search", icon: Search, label: "검색", size: 24 },
  { path: "/watchlist", icon: Star, label: "관심", size: 24 },
  { path: "/portfolio", icon: Wallet, label: "포트폴리오", size: 28 },
  { path: "/more", icon: User, label: "마이", size: 24 },
];

export function Layout() {
  const location = useLocation();
  useMe(); // 재진입 시 서버에서 최신 프로필 조회 → Zustand 갱신

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_8%,transparent),transparent_28%),var(--color-background)]">
      {/* 메인 콘텐츠 — 하단 네비(pb-20) 여백 확보 */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-40 w-full rounded-3xl" /><Skeleton className="h-80 w-full rounded-3xl" /></div>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 하단 네비게이션 — 5탭 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/82 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_40px_-30px_rgba(15,23,42,0.4)]">
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1 px-3 pt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex h-14 flex-1 flex-col items-center justify-center rounded-2xl transition-all ${
                  isActive ? "bg-primary/10" : "hover:bg-secondary/70"
                }`}
              >
                <Icon
                  style={{ width: item.size, height: item.size }}
                  className={`mb-1 transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] transition-colors duration-200 ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground font-medium"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-x-4 bottom-1 h-1 rounded-full bg-primary/75"
                  />
                )}
              </Link>
            );
          })}
        </div>
        <div className="pointer-events-none absolute left-4 top-2 hidden sm:block">
          <AppBrandMark compact className="opacity-60" />
        </div>
      </nav>
    </div>
  );
}
