import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/app/components/ui";
import { useMarketIndex, MarketIndex } from "@/hooks/use-market-index";

/**
 * Task #67 — 시장 인덱스 미니카드 (KOSPI / KOSDAQ / S&P500)
 */
export function MarketIndexSection() {
  const { data, isLoading } = useMarketIndex();

  if (isLoading) {
    return (
      <div className="flex gap-2 px-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-1 h-[90px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="flex gap-2 px-4">
      {data.map((index) => (
        <MarketIndexCard key={index.name} index={index} />
      ))}
    </div>
  );
}

function MarketIndexCard({ index }: { index: MarketIndex }) {
  const isUp = index.fluctuationRate >= 0;
  const color = isUp ? "#2EBE7A" : "#EF4444";

  return (
    <div className="flex-1 bg-card rounded-xl p-3 shadow-sm border border-border">
      <div className="text-muted-foreground text-[10px] font-medium mb-0.5">{index.name}</div>
      <div className="text-foreground font-bold text-base tabular-nums">
        {(index.currentPrice ?? 0).toLocaleString()}
      </div>

      <div
        className="text-[11px] font-semibold tabular-nums mb-1"
        style={{ color }}
      >
        {isUp ? "+" : ""}
        {index.fluctuationRate.toFixed(2)}%
      </div>

      {/* 미니 라인 차트 — 축/격자 없음 */}
      {index.history.length > 0 && (
        <ResponsiveContainer width="100%" height={28}>
          <LineChart data={index.history}>
            <Line
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
