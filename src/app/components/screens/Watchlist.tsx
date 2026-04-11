import { useState, useEffect, useMemo } from "react";
import { Plus, Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Skeleton } from "@/app/components/ui";
import { WatchlistItemCard } from "@/app/components/watchlist/WatchlistItemCard";
import { AddItemSheet } from "@/app/components/watchlist/AddItemSheet";
import { WatchlistBottomSheet } from "@/app/components/watchlist/WatchlistBottomSheet";
import { toast } from "sonner";

export function Watchlist() {
  const { groups, useGroupItems, createGroup, updateGroupName, deleteGroup } = useWatchlist();
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);

  useEffect(() => {
    if (groups.data && groups.data.length > 0 && activeGroup === null) {
      setActiveGroup(groups.data[0].id);
    } else if (groups.data && groups.data.length > 0 && !groups.data.find((g) => g.id === activeGroup)) {
      setActiveGroup(groups.data[0].id);
    }
  }, [groups.data, activeGroup]);

  const itemsQuery = useGroupItems(activeGroup);
  const stocks = itemsQuery.data?.items ?? [];
  const activeGroupName = groups.data?.find((g) => g.id === activeGroup)?.name ?? "관심 그룹";

  const lastUpdatedAt = useMemo(() => {
    if (!itemsQuery.dataUpdatedAt) return null;
    return new Date(itemsQuery.dataUpdatedAt);
  }, [itemsQuery.dataUpdatedAt]);

  const handleCreateGroup = (name: string) => {
    createGroup.mutate(name, {
      onSuccess: () => toast.success("그룹이 생성되었습니다."),
      onError: () => toast.error("그룹 생성에 실패했습니다."),
    });
  };

  const handleUpdateGroupName = (groupId: number, name: string) => {
    updateGroupName.mutate(
      { groupId, name },
      {
        onSuccess: () => toast.success("그룹 이름이 변경되었습니다."),
      }
    );
  };

  const handleDeleteGroup = (groupId: number) => {
    deleteGroup.mutate(groupId, {
      onSuccess: () => toast.success("그룹이 삭제되었습니다."),
    });
  };

  const handleToggleExpand = (ticker: string) => {
    setExpandedTicker((prev) => (prev === ticker ? null : ticker));
  };

  return (
    <div className="min-h-full pb-6 relative">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        {groups.isLoading ? (
          <Skeleton className="h-8 w-32 rounded-lg" />
        ) : (
          <button
            onClick={() => setIsGroupSheetOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-xl hover:bg-secondary active:scale-[0.98] transition-all"
          >
            <span className="text-xl font-bold text-foreground">{activeGroupName}</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

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
          <EmptyState onAdd={() => setIsAddSheetOpen(true)} hasGroup={!!activeGroup} />
        )}
      </div>

      {lastUpdatedAt && stocks.length > 0 && (
        <p className="text-muted-foreground text-xs text-center mt-4 mb-2">
          마지막 업데이트:{" "}
          {lastUpdatedAt.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      <AnimatePresence>
        {activeGroup !== null && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsAddSheetOpen(true)}
            aria-label="종목 추가"
            className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/20 flex items-center justify-center z-40"
          >
            <Plus className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {isAddSheetOpen && activeGroup !== null && (
        <AddItemSheet
          groupId={activeGroup}
          existingTickers={stocks.map((s) => s.ticker)}
          onClose={() => setIsAddSheetOpen(false)}
        />
      )}

      <AnimatePresence>
        {isGroupSheetOpen && (
          <WatchlistBottomSheet
            groups={groups.data ?? []}
            activeGroupId={activeGroup}
            onSelect={(id) => {
              setActiveGroup(id);
              setExpandedTicker(null);
            }}
            onClose={() => setIsGroupSheetOpen(false)}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroupName}
            onDeleteGroup={handleDeleteGroup}
            isLoading={groups.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onAdd, hasGroup }: { onAdd: () => void; hasGroup: boolean }) {
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
          if (hasGroup) {
            onAdd();
          } else {
            document.querySelector<HTMLButtonElement>('[aria-label="검색"]')?.click();
          }
        }}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm"
      >
        <Search className="w-4 h-4" />
        첫 종목 추가하기
      </button>
    </motion.div>
  );
}