import { useState, useEffect, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Skeleton } from "@/app/components/ui";
import { WatchlistItemCard } from "@/app/components/watchlist/WatchlistItemCard";
import { toast } from "sonner";

/**
 * Task #71 ~ #74 — 관심 탭 고도화
 * - RSI 뱃지 + AI 진단 (WatchlistItemCard)
 * - 메모 아코디언, 스와이프 삭제
 * - 빈 상태 개선
 */
export function Watchlist() {
  const { groups, useGroupItems, createGroup } = useWatchlist();
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    if (groups.data && groups.data.length > 0 && activeGroup === null) {
      setActiveGroup(groups.data[0].id);
    }
  }, [groups.data, activeGroup]);

  const itemsQuery = useGroupItems(activeGroup);
  const stocks = itemsQuery.data?.items ?? [];

  // 마지막 업데이트 시각
  const lastUpdatedAt = useMemo(() => {
    if (!itemsQuery.dataUpdatedAt) return null;
    return new Date(itemsQuery.dataUpdatedAt);
  }, [itemsQuery.dataUpdatedAt]);

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    createGroup.mutate(name, {
      onSuccess: () => {
        setNewGroupName("");
        setIsCreating(false);
        toast.success("그룹이 생성되었습니다.");
      },
      onError: () => toast.error("그룹 생성에 실패했습니다."),
    });
  };

  const handleToggleExpand = (ticker: string) => {
    setExpandedTicker((prev) => (prev === ticker ? null : ticker));
  };

  return (
    <div className="min-h-full pb-6">
      {/* 그룹 칩 탭 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {groups.isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />)
          ) : (
            <>
              {groups.data?.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroup(group.id);
                    setExpandedTicker(null);
                  }}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeGroup === group.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {group.name}
                  <span className="ml-1.5 text-[11px] opacity-60">{group.itemCount}</span>
                </button>
              ))}

              {isCreating ? (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateGroup();
                      if (e.key === "Escape") { setIsCreating(false); setNewGroupName(""); }
                    }}
                    placeholder="그룹 이름"
                    className="px-3 py-2 rounded-full bg-secondary text-foreground outline-none text-sm w-28"
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={createGroup.isPending}
                    className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    추가
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  그룹
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 종목 리스트 */}
      <div className="px-4">
        {itemsQuery.isLoading ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-4 border-b border-border last:border-0">
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : stocks.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {stocks.map((stock, index) => (
              <WatchlistItemCard
                key={stock.ticker}
                stock={stock}
                groupId={activeGroup!}
                isLast={index === stocks.length - 1}
                isExpanded={expandedTicker === stock.ticker}
                onToggleExpand={() => handleToggleExpand(stock.ticker)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* 마지막 업데이트 타임스탬프 */}
      {lastUpdatedAt && stocks.length > 0 && (
        <p className="text-muted-foreground text-xs text-center mt-4 mb-2">
          마지막 업데이트:{" "}
          {lastUpdatedAt.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

/** Task #74 — 빈 상태 개선 */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="text-5xl mb-5">📊</div>
      <p className="text-foreground font-semibold text-base mb-2">
        관심 종목을 추가해<br />AI 진단을 받아보세요
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        RSI 뱃지와 AI 한줄 분석이<br />매일 자동으로 업데이트됩니다
      </p>
      <button
        onClick={() => {
          // GlobalSearch 오버레이 열기 — AppBar의 검색 버튼과 동일한 동작
          // Layout에서 관리하는 상태이므로 AppBar의 검색 버튼을 programmatic하게 트리거
          document.querySelector<HTMLButtonElement>('[aria-label="검색"]')?.click();
        }}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm"
      >
        <Search className="w-4 h-4" />
        첫 종목 추가하기
      </button>
    </motion.div>
  );
}
