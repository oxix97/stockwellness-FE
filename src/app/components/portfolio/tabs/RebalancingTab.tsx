import { Progress, Skeleton } from "@/app/components/ui";
import { RebalancingItem } from "@/types/api";
import { formatCurrency } from "@/utils/format";
import { usePortfolioAnalysis } from "@/hooks/use-portfolio";

/**
 * Task #83 — AI 리밸런싱 탭
 */
export function RebalancingTab() {
  const { rebalancing, advice, isLoading } = usePortfolioAnalysis();

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const items = rebalancing?.items ?? [];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* AI 조언 카드 */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <p className="text-foreground font-semibold text-sm">AI 리밸런싱 조언</p>
        </div>
        <p className="text-foreground text-sm leading-relaxed">
          {advice?.content ?? "AI 분석 데이터를 불러오는 중입니다..."}
        </p>
      </div>

      {/* 비중 이탈 현황 */}
      {items.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-foreground font-semibold text-sm mb-4">비중 이탈 현황</p>
          <div className="space-y-4">
            {items.map((item) => (
              <DeviationRow key={item.symbol} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 권장 액션 */}
      {items.some((i) => Math.abs(i.diffWeight) >= 3) && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-foreground font-semibold text-sm mb-3">권장 액션</p>
          <div className="space-y-2">
            {items
              .filter((i) => Math.abs(i.diffWeight) >= 3)
              .map((item) => (
                <ActionCard key={item.symbol} item={item} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeviationRow({ item }: { item: RebalancingItem }) {
  const isOver = item.diffWeight > 0;
  const isWarning = Math.abs(item.diffWeight) >= 3;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <p className="text-foreground font-medium text-sm">{item.name || item.symbol}</p>
        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="text-muted-foreground">목표 {item.targetWeight}%</span>
          <span
            className="font-semibold"
            style={{ color: isWarning ? "#F59E0B" : undefined }}
          >
            현재 {item.currentWeight.toFixed(1)}%
            {isWarning && ` (${isOver ? "+" : ""}${item.diffWeight.toFixed(1)}%p)`}
          </span>
        </div>
      </div>
      <Progress
        value={item.currentWeight}
        className="h-1.5"
        style={
          isWarning
            ? ({ "--progress-indicator-color": "#F59E0B" } as React.CSSProperties)
            : undefined
        }
      />
    </div>
  );
}

function ActionCard({ item }: { item: RebalancingItem }) {
  const isSell = item.diffWeight > 0;
  const qty = Math.abs(item.recommendedQuantity - item.currentQuantity);

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 border-l-4 ${
        isSell
          ? "border-down/40 bg-down/10"
          : "border-up/40 bg-up/10"
      }`}
    >
      <div>
        <p className="text-foreground font-semibold text-sm">
          {isSell ? "📤 매도" : "📥 매수"} {item.name || item.symbol}
        </p>
        <p className="text-muted-foreground text-xs">{qty}주</p>
      </div>
      <p
        className="font-bold text-sm tabular-nums"
        style={{ color: isSell ? "var(--down)" : "var(--up)" }}
      >
        ≈ ₩{formatCurrency(Math.abs(item.expectedTradeAmount))}
      </p>
    </div>
  );
}
