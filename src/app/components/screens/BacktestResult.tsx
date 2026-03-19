import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Activity } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { useBacktest } from "@/hooks/use-backtest";
import { Skeleton } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";

export function BacktestResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || {};
  
  const { run, data, isLoading, metrics, isError } = useBacktest();

  useEffect(() => {
    if (config.strategy) {
      run({
        strategy: config.strategy,
        amount: config.amount,
        benchmarkTicker: config.benchmarkTicker,
      });
    }
  }, [config, run]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !data || !metrics) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">😵‍💫</div>
        <div className="text-xl font-bold mb-2">결과를 불러오지 못했어요</div>
        <div className="text-muted-foreground mb-8">서버 상태를 확인하거나 다시 시도해 주세요.</div>
        <button 
          onClick={() => navigate(-1)}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  const backtestData = data.dailyResults;

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title="시뮬레이션 결과" showBack />

      {/* 결과 요약 */}
      <div className="px-6 py-10 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border text-center">
        <div className="text-muted-foreground mb-2 font-medium">
          {config.amount.toLocaleString()}원이
        </div>
        <div className="text-foreground mb-3 font-bold text-5xl">
          ₩ {metrics.finalValue.toLocaleString()}
        </div>
        <div className="text-primary mb-4 font-bold text-3xl">
          {metrics.totalReturn >= 0 ? "+" : ""}{metrics.totalReturn}%
        </div>
        <div className="text-muted-foreground font-medium">되었을 거예요!</div>

        {/* 벤치마크 비교 */}
        <div className="bg-card rounded-3xl p-6 mt-8 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="text-muted-foreground text-sm mb-1 font-medium">벤치마크 대비</div>
              <div className="text-foreground font-bold text-xl">
                {config.benchmarkTicker}보다
              </div>
            </div>
            <div className="text-right">
              <div className="text-primary font-bold text-3xl">
                {metrics.outperformance >= 0 ? "+" : ""}{metrics.outperformance.toFixed(1)}%
              </div>
              <div className="text-muted-foreground text-sm font-medium">더 높은 수익</div>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="px-6 py-10 bg-card border-b border-border">
        <div className="flex items-center gap-2 mb-8">
          <Activity className="w-6 h-6 text-primary" />
          <div className="text-foreground font-bold text-xl">자산 성장 추이</div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={backtestData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fontWeight: 500 }}
                stroke="#9CA3AF"
                interval={Math.floor(backtestData.length / 5)}
              />
              <YAxis
                tick={{ fontSize: 10, fontWeight: 500 }}
                stroke="#9CA3AF"
                hide
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => `₩${value.toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="benchmarkReturnRate"
                stroke="#9CA3AF"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="벤치마크"
              />
              <Line
                type="monotone"
                dataKey="totalValue"
                stroke="#2EBE7A"
                strokeWidth={4}
                dot={false}
                name="내 포트폴리오"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground font-medium">내 포트폴리오</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-muted-foreground border-dashed border-t"></div>
            <span className="text-sm text-muted-foreground font-medium">벤치마크</span>
          </div>
        </div>
      </div>

      {/* 성과 지표 */}
      <div className="px-6 py-10">
        <div className="text-foreground mb-6 font-bold text-2xl">상세 성과 지표</div>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="연평균 수익률" value={`${metrics?.cagr}%`} sub="CAGR" color="text-primary" />
          <MetricCard label="최대 낙폭" value={`${metrics?.mdd}%`} sub="MDD" color="text-[#FF4756]" />
          <MetricCard label="위험 대비 수익" value={metrics?.sharpeRatio} sub="샤프 지수" />
          <MetricCard label="시장 민감도" value={metrics?.beta ?? "-"} sub="Beta" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color = "text-foreground" }: any) {
  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
      <div className="text-muted-foreground text-sm mb-2 font-medium">{label}</div>
      <div className={`${color} mb-1 font-bold text-3xl`}>
        {value}
      </div>
      <div className="text-muted-foreground text-xs font-bold uppercase">{sub}</div>
    </div>
  );
}
