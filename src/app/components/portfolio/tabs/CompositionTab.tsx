import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/app/components/ui";
import { usePortfolioDetails } from "@/hooks/use-portfolio";
import { formatCurrency, formatPercent } from "@/utils/format";

const CHART_COLORS = ["#2EBE7A", "#1A56DB", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"];

/**
 * Task #81 — 구성/비중 탭: 도넛 차트 + 보유 종목 테이블
 */
export function CompositionTab() {
  const { data: holdings, isLoading: isDetailsLoading } = usePortfolioDetails();

  if (isDetailsLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const items = holdings?.items ?? [];
  const totalCurrentValue = items.reduce((sum, item) => sum + (item.currentValue ?? 0), 0);
  const allocationData = items
    .filter((item) => (item.currentValue ?? 0) > 0)
    .map((item) => ({
      name: item.name || item.symbol,
      value: totalCurrentValue > 0 ? ((item.currentValue ?? 0) / totalCurrentValue) * 100 : 0,
    }));

  return (
    <div className="px-4 py-4 space-y-4">
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
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border grid grid-cols-[1.6fr_0.8fr_1fr_1.3fr] gap-3 text-xs text-muted-foreground font-medium">
            <span>종목</span>
            <span className="text-right">보유 수량</span>
            <span className="text-right">매입가</span>
            <span className="text-right">현재가</span>
          </div>
          {items.map((item, i) => (
            <div
              key={item.symbol}
              className={`px-4 py-3 grid grid-cols-[1.6fr_0.8fr_1fr_1.3fr] gap-3 items-center text-sm ${
                i < items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="text-foreground font-semibold">{item.name || item.symbol}</p>
                <p className="text-muted-foreground text-xs">{item.symbol}</p>
              </div>
              <p className="text-right text-foreground font-medium tabular-nums">
                {item.assetType === "STOCK" ? `${item.quantity}주` : item.quantity}
              </p>
              <p className="text-right text-foreground tabular-nums">
                ₩{formatCurrency(item.purchasePrice)}
              </p>
              <div className="text-right">
                <p className="text-foreground tabular-nums">₩{formatCurrency(item.currentPrice ?? item.purchasePrice)}</p>
                <p className={`text-xs tabular-nums ${(item.currentValue ?? 0) - item.purchaseAmount >= 0 ? "text-up" : "text-down"}`}>
                  {`${(item.currentValue ?? 0) - item.purchaseAmount >= 0 ? "+" : "-"}₩${formatCurrency(Math.abs((item.currentValue ?? 0) - item.purchaseAmount))}`}
                </p>
                <p className={`text-xs tabular-nums ${(item.returnRate ?? 0) >= 0 ? "text-up" : "text-down"}`}>
                  {formatPercent(item.returnRate ?? 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
