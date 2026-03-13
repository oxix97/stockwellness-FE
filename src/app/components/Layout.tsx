import { Outlet, Link, useLocation } from "react-router";
import { Home, Search, Wallet, Star, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/search", icon: Search, label: "검색" },
    { path: "/portfolio", icon: Wallet, label: "내 주식" },
    { path: "/watchlist", icon: Star, label: "관심" },
    { path: "/more", icon: Menu, label: "전체" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-32">
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

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <Icon
                  className={`w-6 h-6 mb-1 transition-colors duration-200 ${
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
