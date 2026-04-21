import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button, Skeleton } from "@/app/components/ui";
import { ContextHeader, GardenEmptyState, Section } from "@/app/components/shared";
import { WatchlistItemCard } from "@/app/components/watchlist/WatchlistItemCard";
import { AddItemSheet } from "@/app/components/watchlist/AddItemSheet";
import { WatchlistBottomSheet } from "@/app/components/watchlist/WatchlistBottomSheet";

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
    <div className="min-h-full pb-6">
      <div className="page-shell page-content pt-4 md:pt-6">
        <ContextHeader
          variant="watch"
          layout="split"
          title={
            <div>
              <button
                onClick={() => setIsGroupSheetOpen(true)}
                className="flex items-center gap-2 rounded-[calc(var(--mobile-card-radius)-2px)] border border-border/60 bg-card/70 px-3 py-2 text-left md:rounded-2xl"
              >
                <span className="text-[length:var(--mobile-hero-title-size)] font-bold leading-tight tracking-tight text-foreground">{activeGroupName}</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          }
          description="지금 점검할 종목을 먼저 보여주고, 필요할 때 메모와 AI 인사이트를 열어 깊게 확인할 수 있게 구성했습니다."
          actions={
            activeGroup !== null ? (
              <Button onClick={() => setIsAddSheetOpen(true)} className="rounded-2xl">
                <Plus className="h-4 w-4" />
                종목 추가
              </Button>
            ) : null
          }
          footer={
            <SummaryChip label="종목 수" value={`${stocks.length}개`} />
          }
        />
      </div>

      <div className="page-shell page-content grid gap-6 pt-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden rounded-[28px] border border-border bg-card p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] lg:block">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-foreground">그룹 빠른 전환</p>
                <p className="text-xs text-muted-foreground">큰 화면에서는 그룹을 옆 패널에서 바로 전환합니다.</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsGroupSheetOpen(true)}>
                편집
              </Button>
            </div>
            <div className="space-y-2">
              {(groups.data ?? []).map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroup(group.id);
                    setExpandedTicker(null);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    activeGroup === group.id ? "border-primary/20 bg-primary/10" : "border-border bg-background hover:bg-secondary/70"
                  }`}
                >
                  <p className={`text-sm font-semibold ${activeGroup === group.id ? "text-primary" : "text-foreground"}`}>{group.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{group.itemCount} 종목</p>
                </button>
              ))}
            </div>
          </div>

          {lastUpdatedAt && stocks.length > 0 && (
            <div className="rounded-[var(--mobile-card-radius)] border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)] md:rounded-[28px] md:py-4">
              마지막 업데이트:{" "}
              {lastUpdatedAt.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </aside>

        <div className="space-y-6">
          <Section
            title="오늘 체크할 종목"
            subtitle="AI 코멘트와 RSI 신호를 함께 보면서 확장형 카드로 관리합니다."
            icon={Sparkles}
            className="px-0 pt-0"
          >
            <div className="px-0">
              {itemsQuery.isLoading ? (
                <div className="overflow-hidden rounded-[28px] border border-border bg-card">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-border px-4 py-4 last:border-0">
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ))}
                </div>
              ) : stocks.length > 0 ? (
                <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
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
                <GardenEmptyState
                  title="아직 관심 종목이 없어요"
                  description="관심 종목을 추가하면 RSI 신호와 AI 한줄 인사이트를 함께 확인할 수 있습니다."
                  actionLabel="첫 종목 추가하기"
                  onAction={() => setIsAddSheetOpen(true)}
                />
              )}
            </div>
          </Section>
        </div>
      </div>

      <AnimatePresence>
        {activeGroup !== null && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsAddSheetOpen(true)}
            aria-label="빠른 종목 추가"
            className="fixed right-5 z-40 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 lg:hidden"
            style={{ bottom: "var(--mobile-fab-offset)", width: "var(--mobile-fab-size)", height: "var(--mobile-fab-size)" }}
          >
            <Plus className="h-7 w-7" />
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

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[calc(var(--mobile-card-radius)-2px)] border border-border/60 bg-card/70 px-3 py-3 md:rounded-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
