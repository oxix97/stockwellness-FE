import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { usePortfolioAnalysis } from "@/hooks/use-portfolio";
import { usePortfolioSimulation } from "@/hooks/use-backtest";
import { Skeleton } from "@/app/components/ui";
import { CorrelationMatrix } from "@/types/api";

const PERIOD_OPTIONS = ["1M", "3M", "6M", "1Y", "3Y"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

/**
 * Task #82 — 시뮬레이션 탭: 백테스트 차트 + 상관관계 히트맵
 */
export function SimulationTab() {
  const [period, setPeriod] = useState<Period>("1Y");
  const { correlation } = usePortfolioAnalysis();

  const backtest = usePortfolioSimulation(period);

  const chartData =
    backtest.data?.dailyResults?.map((d) => ({
      date: d.date.slice(5), // "MM-DD"
      portfolio: Number((d.returnRate ?? 0).toFixed(2)),
      benchmark: d.benchmarkReturnRate ? Number(d.benchmarkReturnRate.toFixed(2)) : null,
    })) ?? [];

  const hasBenchmarkData = chartData.some((d) => d.benchmark !== null);

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 기간 선택 */}
      <div className="flex bg-secondary rounded-xl p-1 gap-1">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === p
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 백테스트 라인 차트 */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <p className="text-foreground font-semibold text-sm mb-3">수익률 비교</p>
        {backtest.isLoading ? (
          <Skeleton className="h-[180px] rounded-xl" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${v.toFixed(2)}%`,
                  name === "portfolio" ? "내 포트폴리오" : "S&P500",
                ]}
                labelStyle={{ fontSize: 11 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend
                formatter={(v) => (v === "portfolio" ? "내 포트폴리오" : "S&P500")}
                wrapperStyle={{ fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#2EBE7A"
                strokeWidth={2}
                dot={false}
              />
              {hasBenchmarkData && (
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">
            백테스트 데이터가 없습니다
          </p>
        )}
      </div>

      {/* 상관관계 히트맵 */}
      {correlation && <CorrelationHeatmap matrix={correlation} />}
    </div>
  );
}

function CorrelationHeatmap({ matrix }: { matrix: CorrelationMatrix }) {
  const tickers = Object.keys(matrix);
  if (tickers.length === 0) return null;

  const getColor = (val: number) => {
    // -1 → red, 0 → white, 1 → blue
    if (val > 0) {
      const intensity = Math.round(val * 200);
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    } else {
      const intensity = Math.round(Math.abs(val) * 200);
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <p className="text-foreground font-semibold text-sm mb-3">종목 간 상관관계</p>
      <div className="overflow-x-auto">
        <table className="text-[11px] text-center w-full">
          <thead>
            <tr>
              <th className="w-14" />
              {tickers.map((t) => (
                <th key={t} className="px-1 py-1 text-muted-foreground font-medium">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((row) => (
              <tr key={row}>
                <td className="text-muted-foreground font-medium pr-1 text-left">{row}</td>
                {tickers.map((col) => {
                  const val = matrix[row]?.[col] ?? 0;
                  return (
                    <td
                      key={col}
                      style={{ backgroundColor: getColor(val) }}
                      className="px-1.5 py-1.5 rounded font-semibold tabular-nums text-foreground"
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
