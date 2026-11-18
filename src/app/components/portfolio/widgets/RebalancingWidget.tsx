import { usePortfolioSummary } from "@/hooks/use-portfolio";
import { formatSignedPercent } from "@/utils/format";
import { Skeleton } from "@/app/components/ui";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { AIAdviceWidget } from "./AIAdviceWidget";
import { RebalancingItem } from "@/types/api";
import { getRebalancingAvailability, getRebalancingItemDecision } from "../rebalancing-status";

export function RebalancingWidget() {
  const { valuation, rebalancing, isLoading } = usePortfolioSummary();

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

  const { status: rebalancingStatus, missingSymbols } = getRebalancingAvailability({
    valuation,
    rebalancing,
  });
  const items = rebalancing?.items ?? [];

  return (
    <div className="space-y-6 pb-10">
      <AIAdviceWidget />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-foreground">리밸런싱 가이드</h3>
          <p className="text-muted-foreground text-[10px]">현재 목표 비중 대비 이탈 현황</p>
        </div>

        {rebalancingStatus === "unavailable" ? (
          <div className="bg-card p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">
              리밸런싱을 계산할 수 없습니다
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {missingSymbols.length > 0
                ? `가격을 확인할 수 없는 종목(${missingSymbols.join(", ")})이 있어 목표 비중과 권고 수량을 산출할 수 없습니다.`
                : "포트폴리오 평가 금액을 확인할 수 없어 목표 비중과 권고 수량을 산출할 수 없습니다."}
            </p>
          </div>
        ) : rebalancingStatus === "zero_total" ? (
          <div className="bg-card p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">
              비중·매매 판단을 산출할 수 없습니다
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              총 평가액이 0원(₩0)이어서 현재 비중과 목표 비중 차이, 권고 수량을 판단할 수 없습니다.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card p-8 rounded-2xl border border-dashed border-border text-center">
            <p className="text-muted-foreground text-sm">
              리밸런싱이 필요한 항목이 없습니다.
            </p>
          </div>
        ) : (
          items.map((item: RebalancingItem) => {
            const badge = getRebalancingItemBadge(item);
            return (
              <div
                key={item.symbol}
                className="bg-card p-4 rounded-2xl border border-border shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-foreground font-bold text-base">{item.name}</p>
                    <p className="text-muted-foreground text-[10px] uppercase font-medium">{item.symbol}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.className}`}>
                    {badge.label}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-muted-foreground text-[10px] mb-1">현재 비중</p>
                    <p className="text-foreground font-semibold text-sm">
                      {(item.currentWeight as number | null | undefined) == null
                        ? "—"
                        : formatSignedPercent(item.currentWeight, { showArrow: false, showSign: false })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-[10px] mb-1">목표 비중</p>
                    <p className="text-foreground font-semibold text-sm">
                      {(item.targetWeight as number | null | undefined) == null
                        ? "—"
                        : formatSignedPercent(item.targetWeight, { showArrow: false, showSign: false })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-[10px] mb-1">차이</p>
                    <p className="font-semibold text-sm">
                      <SignedValueLabel
                        value={item.diffWeight}
                        format="percent"
                        fallback="—"
                        ariaLabelPrefix={`${item.name} 비중 차이`}
                      />
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getRebalancingItemBadge(item: RebalancingItem): { label: string; className: string } {
  const decision = getRebalancingItemDecision(item);
  const qty = item.recommendedQuantity;
  if (decision === "unavailable" || qty == null || !Number.isFinite(qty)) {
    return {
      label: "수량 계산 불가",
      className: "bg-muted text-muted-foreground",
    };
  }
  if (decision === "none") {
    return {
      label: "추가 매매 없음",
      className: "bg-secondary text-muted-foreground",
    };
  }
  if (decision === "buy") {
    return {
      label: `+${qty}주 매수`,
      className: "bg-up/10 text-up",
    };
  }
  return {
    label: `${Math.abs(qty)}주 매도`,
    className: "bg-down/10 text-down",
  };
}
