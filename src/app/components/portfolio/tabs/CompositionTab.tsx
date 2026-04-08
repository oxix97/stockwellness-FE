import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/app/components/ui";
import { usePortfolioSummary, usePortfolioDetails } from "@/hooks/use-portfolio";
import { formatCurrency } from "@/utils/format";

const CHART_COLORS = ["#2EBE7A", "#1A56DB", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"];

/**
 * Task #81 — 구성/비중 탭: 도넛 차트 + 보유 종목 테이블
 */
export function CompositionTab() {
  const { diversification, isLoading: isSummaryLoading } = usePortfolioSummary();
  const { data: holdings, isLoading: isDetailsLoading } = usePortfolioDetails();

  if (isSummaryLoading || isDetailsLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const sectorRatios = diversification?.sectorRatios ?? [];
  const items = holdings?.items ?? [];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 섹터 도넛 차트 */}
      {sectorRatios.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-foreground font-semibold text-sm mb-4">섹터 배분</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sectorRatios}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {sectorRatios.map((_, index) => (
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
          <div className="px-4 py-3 border-b border-border grid grid-cols-4 text-xs text-muted-foreground font-medium">
            <span className="col-span-2">종목</span>
            <span className="text-right">목표 비중</span>
            <span className="text-right">매입가</span>
          </div>
          {items.map((item, i) => (
            <div
              key={item.symbol}
              className={`px-4 py-3 grid grid-cols-4 items-center text-sm ${
                i < items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="col-span-2">
                <p className="text-foreground font-semibold">{item.name || item.symbol}</p>
                <p className="text-muted-foreground text-xs">{item.quantity}주</p>
              </div>
              <p className="text-right text-foreground font-medium tabular-nums">
                {item.targetWeight}%
              </p>
              <p className="text-right text-foreground tabular-nums">
                ₩{formatCurrency(item.purchasePrice)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
