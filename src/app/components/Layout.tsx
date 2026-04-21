import { Suspense } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { Home, Search, Star, Wallet, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMe } from "@/hooks/use-member";
import { Skeleton } from "@/app/components/ui";
import { AppBrandMark } from "@/app/components/shared";
import { cn } from "@/app/components/ui/utils";
import { useViewportType } from "@/app/components/ui/use-mobile";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "홈", size: 24 },
  { path: "/search", icon: Search, label: "검색", size: 24 },
  { path: "/watchlist", icon: Star, label: "관심", size: 24 },
  { path: "/portfolio", icon: Wallet, label: "포트폴리오", size: 28 },
  { path: "/more", icon: User, label: "마이", size: 24 },
];

function isRouteActive(currentPath: string, itemPath: string) {
  if (itemPath === "/") {
    return currentPath === "/";
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function Layout() {
  const location = useLocation();
  const viewport = useViewportType();
  const isMobile = viewport === "mobile";

  useMe();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_8%,transparent),transparent_28%),var(--color-background)]">
      <div className="hidden border-b border-border/70 bg-background/80 backdrop-blur-xl md:block xl:hidden">
        <div className="page-shell flex min-h-[72px] items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <AppBrandMark />
          </Link>
          <div className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-shell flex min-h-screen gap-6 xl:items-start xl:py-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[272px] shrink-0 overflow-hidden rounded-[32px] border border-border/70 bg-card/88 p-5 shadow-[0_30px_70px_-46px_rgba(15,23,42,0.42)] backdrop-blur-xl xl:flex xl:flex-col">
          <Link to="/" className="mb-6">
            <AppBrandMark />
          </Link>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(location.pathname, item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  <div className={cn("rounded-2xl p-2 transition-colors", isActive ? "bg-primary/12 text-primary" : "bg-secondary/70 text-muted-foreground group-hover:text-foreground")}>
                    <Icon style={{ width: item.size, height: item.size }} />
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <main
            className={cn(
              "min-h-screen flex-1",
              isMobile
                ? "overflow-y-auto [padding-bottom:calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)]"
                : "pb-10 md:pt-6 xl:pt-0"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: isMobile ? 10 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: isMobile ? -10 : -4 }}
                transition={{ duration: isMobile ? 0.2 : 0.16, ease: "easeOut" }}
              >
                <Suspense
                  fallback={
                    <div className="page-shell page-content space-y-4 pt-6">
                      <Skeleton className="h-40 w-full rounded-3xl" />
                      <Skeleton className="h-80 w-full rounded-3xl" />
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/82 shadow-[0_-16px_40px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1 px-3 pt-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center rounded-2xl transition-all",
                  isActive ? "bg-primary/10" : "hover:bg-secondary/70"
                )}
                style={{ height: "calc(var(--mobile-bottom-nav-height) - 12px)" }}
              >
                <Icon
                  style={{ width: item.size, height: item.size }}
                  className={cn(
                    "mb-1 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] transition-colors duration-200",
                    isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
                  )}
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
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
