import { usePortfolioSummary } from "@/hooks/use-portfolio";
import { formatPercent } from "@/utils/format";
import { Skeleton } from "@/app/components/ui";
import { AIAdviceWidget } from "./AIAdviceWidget";
import { RebalancingItem } from "@/types/api";

export function RebalancingWidget() {
  const { rebalancing, isLoading } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const items = rebalancing?.items ?? [];

  return (
    <div className="space-y-6 pb-10">
      <AIAdviceWidget />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-foreground">리밸런싱 가이드</h3>
          <p className="text-muted-foreground text-[10px]">
            기준:{" "}
            {rebalancing?.lastUpdated
              ? new Date(rebalancing.lastUpdated).toLocaleString()
              : "정보 없음"}
          </p>
        </div>

        {items.length === 0 && (
          <div className="bg-card p-8 rounded-2xl border border-dashed border-border text-center">
            <p className="text-muted-foreground text-sm">
              리밸런싱이 필요한 항목이 없습니다.
            </p>
          </div>
        )}

        {items.map((item: RebalancingItem) => (
          <div
            key={item.symbol}
            className="bg-card p-4 rounded-2xl border border-border shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-foreground font-bold text-base">{item.name}</p>
                <p className="text-muted-foreground text-[10px] uppercase font-medium">{item.symbol}</p>
              </div>
              <div
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  item.recommendQuantity > 0
                    ? "bg-up/10 text-up"
                    : "bg-down/10 text-down"
                }`}
              >
                {item.recommendQuantity > 0
                  ? `+${item.recommendQuantity}주 매수`
                  : `${Math.abs(item.recommendQuantity)}주 매도`}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-muted-foreground text-[10px] mb-1">현재 비중</p>
                <p className="text-foreground font-semibold text-sm">
                  {formatPercent(item.currentWeight)}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-[10px] mb-1">목표 비중</p>
                <p className="text-foreground font-semibold text-sm">
                  {formatPercent(item.targetWeight)}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-[10px] mb-1">차이</p>
                <p
                  className={`font-semibold text-sm ${
                    item.diffWeight > 0 ? "text-up" : "text-down"
                  }`}
                >
                  {item.diffWeight > 0 ? "+" : ""}
                  {formatPercent(item.diffWeight)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
