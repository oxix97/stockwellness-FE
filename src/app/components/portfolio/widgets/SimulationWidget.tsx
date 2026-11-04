import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/app/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { usePortfolioSimulation, computeMetrics } from "@/hooks/use-backtest";
import { ChartPeriod } from "@/types/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";

const PERIOD_OPTIONS: { label: string; value: ChartPeriod }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
];

export function SimulationWidget() {
  const [period, setPeriod] = useState<ChartPeriod>("1Y");
  const { data, isLoading, isError } = usePortfolioSimulation(period);

  const metrics = useMemo(() => {
    if (!data?.dailyResults) return null;
    return computeMetrics(data.dailyResults);
  }, [data?.dailyResults]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const chartData = data.dailyResults.map((r) => ({
    date: r.date,
    portfolio: r.portfolioReturnRate,
    ...r.benchmarkReturnRates,
  }));

  const benchmarks = data.comparisons.map((c) => ({
    key: c.ticker,
    label: c.indexName,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">성과 시뮬레이션</h3>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(val) => val && setPeriod(val as ChartPeriod)}
          className="justify-start bg-muted/50 p-1 rounded-lg"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="h-7 px-2.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="누적 수익률"
            value={metrics.totalReturn}
            signed
          />
          <MetricCard
            label="연평균 (CAGR)"
            value={metrics.cagr}
            signed
          />
          <MetricCard
            label="최대 낙폭 (MDD)"
            value={metrics.mdd}
            signed
          />
          <MetricCard label="샤프 지수" value={metrics.sharpeRatio?.toString() ?? "-"} />
          <MetricCard label="소르티노 지수" value={metrics.sortinoRatio?.toString() ?? "0"} />
          <MetricCard
            label="시장 민감도 (Beta)"
            value={metrics.beta?.toString() ?? "-"}
          />
          <MetricCard
            label="최장 회복 기간"
            value={`${metrics.recoveryPeriod}일`}
          />
        </div>
      )}

      <div className="h-[280px] w-full rounded-xl border bg-card/50 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(str) => format(new Date(str), "MMM d")}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(val) => `${val}%`}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
                      <p className="font-semibold mb-1.5 border-bottom pb-1 border-muted">
                        {format(new Date(label), "yyyy.MM.dd")}
                      </p>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                          <SignedValueLabel value={Number(entry.value)} format="percent" className="font-bold" />
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right"
              height={30} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingBottom: 10 }} 
            />
            <Line
              name="내 포트폴리오"
              type="monotone"
              dataKey="portfolio"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)", stroke: "#fff", strokeWidth: 2 }}
            />
            {benchmarks.map((benchmark, i) => (
              <Line
                key={benchmark.key}
                name={benchmark.label}
                type="monotone"
                dataKey={benchmark.key}
                stroke={i === 0 ? "#94a3b8" : "#cbd5e1"}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  signed = false,
}: {
  label: string;
  value: string | number;
  signed?: boolean;
}) {
  return (
    <Card className="border shadow-none bg-muted/10">
      <CardContent className="p-3">
        <p className="text-[10px] uppercase font-bold text-muted-foreground/70 mb-1 tracking-wider">
          {label}
        </p>
        <div className="flex items-center gap-1">
          {signed ? (
            <SignedValueLabel value={value} format="percent" className="text-sm font-bold" />
          ) : (
            <span className="text-sm font-bold text-foreground">{value}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
