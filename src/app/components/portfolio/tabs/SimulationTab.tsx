import { Fragment, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/app/components/ui";
import { usePortfolioCorrelation, usePortfolioDetails } from "@/hooks/use-portfolio";
import { usePortfolioSimulation } from "@/hooks/use-backtest";
import { CorrelationMatrix } from "@/types/api";
import { formatPercent } from "@/utils/format";

const PERIOD_OPTIONS = ["1M", "3M", "6M", "1Y"] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

const BENCHMARK_LABELS: Record<string, string> = {
  "2001": "코스피 200",
  SPX: "S&P 500",
  NDX: "나스닥 100",
  ".DJI": "다우존스 산업",
};

export function SimulationTab() {
  const [period, setPeriod] = useState<Period>("1Y");
  const correlation = usePortfolioCorrelation();
  const { data: holdings } = usePortfolioDetails();
  const simulation = usePortfolioSimulation(period);

  const symbolNameMap = useMemo(
    () => Object.fromEntries((holdings?.items ?? []).map((item) => [item.symbol, item.name || item.symbol])),
    [holdings?.items]
  );

  const chartData = simulation.data?.dailyResults.map((result) => ({
    date: result.date.slice(5),
    portfolio: Number((result.portfolioReturnRate ?? 0).toFixed(2)),
    ...Object.fromEntries(
      Object.entries(result.benchmarkReturnRates ?? {}).map(([ticker, value]) => [ticker, Number(value.toFixed(2))])
    ),
  })) ?? [];

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex bg-secondary rounded-xl p-1 gap-1">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setPeriod(option)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              period === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="mb-3">
          <p className="text-foreground font-semibold text-sm">생성 시점 대비 누적 수익률</p>
          <p className="text-muted-foreground text-xs mt-1">
            포트폴리오 생성일 이후 실제 보유 내역 기준 수익률입니다.
          </p>
        </div>
        {simulation.isLoading ? (
          <Skeleton className="h-[220px] rounded-xl" />
        ) : chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
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
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === "portfolio" ? "내 포트폴리오" : BENCHMARK_LABELS[name] || name,
                  ]}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="portfolio" stroke="#2EBE7A" strokeWidth={2.5} dot={false} />
                {simulation.data?.comparisons.map((comparison, index) => (
                  <Line
                    key={comparison.ticker}
                    type="monotone"
                    dataKey={comparison.ticker}
                    stroke={["#94A3B8", "#3B82F6", "#F59E0B", "#EF4444"][index % 4]}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <BenchmarkSummaryCard
                label="내 포트폴리오"
                returnRate={simulation.data?.dailyResults.at(-1)?.portfolioReturnRate ?? 0}
                emphasize
              />
              {simulation.data?.comparisons.map((comparison) => (
                <BenchmarkSummaryCard
                  key={comparison.ticker}
                  label={comparison.indexName || BENCHMARK_LABELS[comparison.ticker] || comparison.ticker}
                  returnRate={comparison.totalReturn}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-10">생성 시점 성과 데이터가 없습니다</p>
        )}
      </div>

      {correlation.data && <CorrelationHeatmap matrix={correlation.data} labels={symbolNameMap} />}
    </div>
  );
}

function BenchmarkSummaryCard({
  label,
  returnRate,
  emphasize = false,
}: {
  label: string;
  returnRate: number;
  emphasize?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${emphasize ? "border-primary/30 bg-primary/5" : "border-border bg-background/40"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${returnRate >= 0 ? "text-up" : "text-down"}`}>
        {formatPercent(returnRate)}
      </p>
    </div>
  );
}

function CorrelationHeatmap({
  matrix,
  labels,
}: {
  matrix: CorrelationMatrix;
  labels: Record<string, string>;
}) {
  const tickers = Object.keys(matrix);
  if (tickers.length === 0) return null;

  const getColor = (value: number) => {
    if (value >= 0) {
      const intensity = Math.round(value * 180);
      return `rgb(255, ${245 - intensity}, ${245 - intensity})`;
    }
    const intensity = Math.round(Math.abs(value) * 180);
    return `rgb(${245 - intensity}, ${245 - intensity}, 255)`;
  };

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-foreground font-semibold text-sm">종목 간 상관관계</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="rounded px-1.5 py-0.5 bg-[#dbeafe] text-[#1d4ed8]">-1</span>
          <span className="rounded px-1.5 py-0.5 bg-secondary text-foreground">0</span>
          <span className="rounded px-1.5 py-0.5 bg-[#fee2e2] text-[#b91c1c]">+1</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `96px repeat(${tickers.length}, 72px)` }}>
          <div />
          {tickers.map((ticker) => (
            <div key={ticker} className="px-1 text-center text-[11px] font-medium text-muted-foreground">
              {labels[ticker] || ticker}
            </div>
          ))}
          {tickers.map((rowTicker, rowIdx) => (
            <Fragment key={rowTicker}>
              <div className="flex items-center text-[11px] font-medium text-muted-foreground">
                {labels[rowTicker] || rowTicker}
              </div>
              {tickers.map((colTicker, colIdx) => {
                if (colIdx > rowIdx) {
                  return <div key={`${rowTicker}-${colTicker}`} className="h-14" />;
                }

                const value = matrix[rowTicker]?.[colTicker] ?? 0;
                const isDiagonal = rowIdx === colIdx;
                return (
                  <div
                    key={`${rowTicker}-${colTicker}`}
                    style={{ backgroundColor: isDiagonal ? "color-mix(in srgb, var(--primary) 12%, transparent)" : getColor(value) }}
                    className="h-14 rounded-lg px-1 flex flex-col items-center justify-center text-center"
                  >
                    <p className="text-[10px] text-muted-foreground">{labels[colTicker] || colTicker}</p>
                    <p className="text-xs font-semibold tabular-nums text-foreground">{value.toFixed(2)}</p>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
