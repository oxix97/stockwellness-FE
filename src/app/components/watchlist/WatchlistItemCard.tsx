import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import { WatchlistItemDetail } from "@/types/api";
import { formatPercent } from "@/utils/format";
import { useWatchlist } from "@/hooks/use-watchlist";
import { toast } from "sonner";

interface WatchlistItemCardProps {
  stock: WatchlistItemDetail;
  groupId: number;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

type RsiStatus = "OVERBOUGHT" | "OVERSOLD" | "NEUTRAL" | string;

/** RSI 상태 → 뱃지 스타일 */
function getRsiBadgeStyle(status: RsiStatus) {
  switch (status) {
    case "OVERBOUGHT":
      return { className: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/12 dark:border-amber-400/20 dark:text-amber-200", label: "과매수" };
    case "OVERSOLD":
      return { className: "bg-green-50 border-green-200 text-green-700 dark:bg-emerald-500/12 dark:border-emerald-400/20 dark:text-emerald-200", label: "과매도" };
    default:
      return { className: "bg-gray-100 border-gray-200 text-gray-600 dark:bg-secondary dark:border-border dark:text-muted-foreground", label: "중립" };
  }
}

/**
 * Task #71/#72/#73 — 관심 종목 카드
 * - RSI 뱃지 + AI 한줄 진단
 * - 탭 시 메모 아코디언 확장 (Framer Motion layout)
 * - 좌 스와이프 시 빨간 삭제 버튼 노출
 */
export function WatchlistItemCard({
  stock,
  groupId,
  isLast,
  isExpanded,
  onToggleExpand,
}: WatchlistItemCardProps) {
  const navigate = useNavigate();
  const { removeItem, updateItemNote } = useWatchlist();
  const [note, setNote] = useState(stock.note ?? "");
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 스와이프 관련
  const dragX = useMotionValue(0);
  const deleteOpacity = useTransform(dragX, [-80, -20], [1, 0]);
  const SWIPE_THRESHOLD = -72;

  // const isUp = stock.fluctuationRate !== null && stock.fluctuationRate >= 0;
  const rsiStyle = getRsiBadgeStyle(stock.rsiStatus);

  /** 메모 저장 타이머 클린업 (BLOCKER) */
  useEffect(() => {
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [saveTimer]);

  /** 아코디언 확장 시 스와이프 상태 초기화 (Snap-back) */
  useEffect(() => {
    if (isExpanded) {
      animate(dragX, 0, { duration: 0.2 });
    }
  }, [isExpanded, dragX]);

  /** 메모 변경 시 1초 debounce 자동 저장 */
  const handleNoteChange = (value: string) => {
    setNote(value);
    if (saveTimer) clearTimeout(saveTimer);
    const t = setTimeout(() => {
      updateItemNote.mutate({ groupId, ticker: stock.ticker, note: value });
    }, 1000);
    setSaveTimer(t);
  };

  const handleDelete = () => {
    removeItem.mutate(
      { groupId, ticker: stock.ticker },
      {
        onSuccess: () => toast.success(`${stock.name} 삭제되었습니다.`),
        onError: () => toast.error("삭제에 실패했습니다."),
      }
    );
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      // 삭제 버튼 위치 고정
      animate(dragX, -80, { type: "spring", stiffness: 300, damping: 30 });
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  return (
    <div className={`relative overflow-hidden ${!isLast ? "border-b border-border" : ""}`}>
      {/* 삭제 버튼 (스와이프 시 노출) */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center"
      >
        <button onClick={handleDelete} className="flex flex-col items-center gap-1">
          <X className="w-5 h-5 text-white" />
          <span className="text-white text-[10px] font-semibold">삭제</span>
        </button>
      </motion.div>

      {/* 카드 본체 */}
      <motion.div
        style={{ x: dragX }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        layout
        className="bg-card"
      >
        {/* 기본 행 — 높이 72px 고정 */}
        <button onClick={onToggleExpand} className="w-full px-4 py-4 text-left">
          {/* 로고 + 종목 정보 */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/stock/${stock.ticker}`);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10"
              >
                <span className="text-primary font-bold text-sm">{stock.name[0]}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{stock.name}</p>
                  {stock.rsiStatus && (
                    <span
                      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${rsiStyle.className}`}
                    >
                      {rsiStyle.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{stock.ticker}</p>
              </div>
            </div>

            {/* 가격 + 등락률 */}
            <div className="ml-2 shrink-0 text-right">
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {stock.currentPrice !== null ? `₩${stock.currentPrice.toLocaleString()}` : "-"}
              </p>
              <p
                className={`text-xs font-medium tabular-nums ${stock.fluctuationRate !== null && stock.fluctuationRate >= 0 ? "text-up" : stock.fluctuationRate !== null ? "text-down" : "text-muted-foreground"}`}
              >
                {stock.fluctuationRate !== null ? formatPercent(stock.fluctuationRate) : "-"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-secondary/65 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">AI Signal</p>
              <p className="mt-1 truncate text-[11px] text-foreground/80">
                {stock.aiInsight || "아직 AI 요약이 없습니다. 메모와 함께 관찰하세요."}
              </p>
            </div>
            <span className="rounded-full border border-border/60 bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground">
              {isExpanded ? "열림" : "탭해 확장"}
            </span>
          </div>
        </button>

        {/* 아코디언 메모 영역 */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="memo"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">📝 나의 메모</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`${stock.name} 종목을 관심 그룹에서 삭제하시겠습니까?`)) {
                        handleDelete();
                      }
                    }}
                    className="text-xs text-destructive flex items-center gap-1 hover:underline"
                  >
                    <X className="w-3 h-3" /> 삭제
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="이 종목에 대한 메모를 남겨보세요..."
                  rows={3}
                  className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
