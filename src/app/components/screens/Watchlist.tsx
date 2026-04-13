import { ReactNode, useEffect, useMemo, useState } from "react";
import { Plus, ChevronDown, Sparkles, FolderTree, Radar, TriangleAlert } from "lucide-react";
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

  const aiInsightCount = stocks.filter((stock) => Boolean(stock.aiInsight)).length;
  const cautionCount = stocks.filter((stock) => stock.rsiStatus === "OVERBOUGHT" || stock.rsiStatus === "OVERSOLD").length;

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
    <div className="min-h-full pb-8">
      <div className="px-4 pt-4">
        <ContextHeader
          variant="watch"
          eyebrow="Watch Garden"
          title={
            <div>
              <button
                onClick={() => setIsGroupSheetOpen(true)}
                className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-left"
              >
                <span className="text-[28px] font-bold leading-tight tracking-tight text-foreground">{activeGroupName}</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          }
          description="지금 점검할 종목을 먼저 보여주고, 필요할 때 메모와 AI 인사이트를 열어 깊게 확인할 수 있게 구성했습니다."
          actions={
            <Button onClick={() => setIsAddSheetOpen(true)} className="rounded-2xl">
              <Plus className="h-4 w-4" />
              종목 추가
            </Button>
          }
          ornament={
            <div className="absolute bottom-4 right-4 flex gap-2">
              <div className="rounded-2xl border border-border/50 bg-card/72 px-3 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Radar className="h-3 w-3 text-primary" />
                  Monitor
                </div>
                <p className="mt-1 text-sm font-bold text-foreground">{aiInsightCount} signals</p>
              </div>
            </div>
          }
          footer={
            <div className="grid grid-cols-3 gap-2">
              <SummaryChip label="종목 수" value={`${stocks.length}개`} />
              <SummaryChip label="AI 인사이트" value={`${aiInsightCount}개`} />
              <SummaryChip label="주의 신호" value={`${cautionCount}개`} icon={<TriangleAlert className="h-3 w-3 text-amber-500" />} />
            </div>
          }
        />
      </div>

      <Section
        title="오늘 체크할 종목"
        subtitle="AI 코멘트와 RSI 신호를 함께 보면서 확장형 카드로 관리합니다."
        icon={Sparkles}
        className="pt-6"
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
              title="아직 이 정원에 심은 종목이 없어요"
              description="관심 종목을 추가하면 RSI 신호와 AI 한줄 인사이트를 함께 쌓아가며 관리할 수 있습니다."
              actionLabel="첫 종목 추가"
              onAction={() => setIsAddSheetOpen(true)}
            />
          )}
        </div>
      </Section>

      {lastUpdatedAt && stocks.length > 0 && (
        <Section
          title="그룹 관리"
          subtitle="관심 그룹 전환과 수정은 아래 시트에서 한 번에 처리합니다."
          icon={FolderTree}
          className="pb-4"
          rightContent={
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsGroupSheetOpen(true)}>
              그룹 편집
            </Button>
          }
        >
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            마지막 업데이트:{" "}
            {lastUpdatedAt.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </Section>
      )}

      <AnimatePresence>
        {activeGroup !== null && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsAddSheetOpen(true)}
            aria-label="종목 추가"
            className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20"
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

function SummaryChip({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-3">
      <div className="flex items-center gap-1">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
