import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button, Skeleton } from "@/app/components/ui";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { usePortfolioDetails } from "@/hooks/use-portfolio";
import { formatCurrency } from "@/utils/format";

const CHART_COLORS = ["var(--primary)", "#1A56DB", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"];

/**
 * Task #81 — 구성/비중 탭: 도넛 차트 + 보유 종목 테이블
 */
export function CompositionTab() {
  const { data: holdings, isLoading: isDetailsLoading, isError: isDetailsError, refetch } = usePortfolioDetails();

  if (isDetailsLoading) {
    return (
      <div role="status" aria-label="보유 종목 불러오는 중" className="min-w-0 space-y-4 px-4 py-4">
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (isDetailsError) {
    return (
      <div role="alert" className="mx-4 my-4 rounded-2xl border border-destructive/30 bg-card p-5 text-center">
        <p className="text-sm font-semibold text-foreground">보유 종목을 불러오지 못했습니다</p>
        <p className="mt-1 text-xs text-muted-foreground">종가와 평가액을 확인하려면 다시 시도해 주세요.</p>
        <Button type="button" className="mt-4 min-h-11 w-full" onClick={() => void refetch()}>
          다시 시도
        </Button>
      </div>
    );
  }

  const items = holdings?.items ?? [];
  const hasUnavailablePrice = items.some((item) => item.currentValue == null || item.priceStatus === "MISSING");
  const totalCurrentValue = hasUnavailablePrice
    ? null
    : items.reduce((sum, item) => sum + (item.currentValue ?? 0), 0);
  const allocationData = (totalCurrentValue != null && totalCurrentValue > 0 ? items : [])
    .filter((item) => (item.currentValue ?? 0) > 0)
    .map((item) => ({
      name: item.name || item.symbol,
      value: ((item.currentValue ?? 0) / totalCurrentValue!) * 100,
    }));

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden px-4 py-4">
      {allocationData.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-foreground font-semibold text-sm mb-4">종목 비중</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {allocationData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, "비중"]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 보유 종목 테이블 */}
      {items.length > 0 && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,.75fr)_minmax(0,.95fr)_minmax(0,1.15fr)] gap-2 border-b border-border px-3 py-3 text-xs font-medium text-muted-foreground sm:px-4 sm:gap-3">
            <span>종목</span>
            <span className="text-right">보유 수량</span>
            <span className="text-right">매입가</span>
            <span className="text-right">기준일 종가</span>
          </div>
          {items.map((item, i) => (
            <div
              key={item.symbol}
              className={`grid min-w-0 grid-cols-[minmax(0,1.35fr)_minmax(0,.75fr)_minmax(0,.95fr)_minmax(0,1.15fr)] items-center gap-2 px-3 py-3 text-sm sm:px-4 sm:gap-3 ${
                i < items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{item.name || item.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{item.symbol}</p>
              </div>
              <p className="truncate text-right font-medium tabular-nums text-foreground">
                {item.assetType === "STOCK" ? `${item.quantity}주` : item.quantity}
              </p>
              <p className="truncate text-right tabular-nums text-foreground">
                ₩{formatCurrency(item.purchasePrice)}
              </p>
              <div className="min-w-0 text-right">
                <p className="truncate tabular-nums text-foreground">
                  {item.currentPrice == null ? "—" : `₩${formatCurrency(item.currentPrice)}`}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{getPriceDescription(item.priceStatus, item.priceAsOfDate)}</p>
                <p className="text-xs">
                  {item.currentValue == null ? (
                    <span className="text-muted-foreground" aria-label={`${item.name || item.symbol} 평가손익 평가할 수 없음`}>—</span>
                  ) : (
                    <SignedValueLabel
                      value={item.currentValue - item.purchaseAmount}
                      format="currency"
                      ariaLabelPrefix={`${item.name || item.symbol} 평가손익`}
                    />
                  )}
                </p>
                <p className="text-xs">
                  {item.returnRate == null ? (
                    <span className="text-muted-foreground" aria-label={`${item.name || item.symbol} 수익률 평가할 수 없음`}>—</span>
                  ) : (
                    <SignedValueLabel value={item.returnRate} format="percent" ariaLabelPrefix={`${item.name || item.symbol} 수익률`} />
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          보유 종목이 없습니다.
        </div>
      )}
    </div>
  );
}

function getPriceDescription(priceStatus: "AVAILABLE" | "STALE" | "MISSING" | undefined, priceAsOfDate: string | null | undefined) {
  if (priceStatus === "MISSING") return "가격 정보를 확인할 수 없습니다";
  const eodDate = formatEodDate(priceAsOfDate);
  if (priceStatus === "STALE") return eodDate ? `${eodDate} 종가 · 이전 영업일` : "이전 영업일 종가";
  return eodDate ? `${eodDate} 종가` : "종가 기준일 확인 불가";
}

function formatEodDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : date.replace(/-/g, ".");
}
