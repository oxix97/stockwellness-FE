import { Outlet, Link, useLocation } from "react-router";
import { Home, Star, Wallet, User, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMe } from "@/hooks/use-member";

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
    <div className="min-h-screen flex flex-col bg-background">
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
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 하단 네비게이션 — 5탭 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
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
                    className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
