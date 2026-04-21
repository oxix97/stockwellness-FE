import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Activity, Sparkles, Printer } from "lucide-react";
import { XAxis, Tooltip, ResponsiveContainer, ComposedChart, Line, ReferenceArea } from "recharts";
import { useBacktest } from "@/hooks/use-backtest";
import { BacktestDailyResult } from "@/types/api";
import { Skeleton, Badge } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";

export function BacktestResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const config = useMemo(() => {
    try {
      const strategy = searchParams.get("strategy") as "DCA" | "LUMP_SUM" | null;
      const amount = Number(searchParams.get("amount") || 0);
      const period = searchParams.get("period") as any; // ChartPeriod
      const rebalancingPeriod = searchParams.get("rebalancingPeriod") as any;
      const dividendReinvested = searchParams.get("dividendReinvested") === "true";
      const weightsStr = searchParams.get("weights");
      
      if (!strategy || !weightsStr) {
        return null;
      }

      return {
        strategy,
        amount,
        benchmarkTicker: searchParams.get("benchmarkTicker") || "SPY",
        period: period || "1Y",
        rebalancingPeriod: rebalancingPeriod || "NONE",
        dividendReinvested,
        weights: JSON.parse(weightsStr)
      };
    } catch (e) {
      console.error("Failed to parse backtest job", e);
      return null;
    }
  }, [searchParams]);

  const hasRun = useRef(false);

  const handlePrint = () => {
    window.print();
  };

  const { run, data, isLoading, metrics, serverMetrics, isError, aiComment } = useBacktest(config?.period);

  const backtestData = useMemo(() => data?.dailyResults ?? [], [data]);

  const yearlyStats = useMemo(() => {
    if (!backtestData || backtestData.length === 0) return { best: null, worst: null };
    const byYear: Record<string, { first: number; last: number }> = {};
    for (const r of backtestData) {
      const year = String(r.date).slice(0, 4);
      if (!byYear[year]) byYear[year] = { first: r.totalValue, last: r.totalValue };
      byYear[year].last = r.totalValue;
    }
    const yearReturns = Object.entries(byYear).map(([year, { first, last }]) => ({
      year,
      returnPct: +((last / first - 1) * 100).toFixed(1),
    }));
    if (yearReturns.length === 0) return { best: null, worst: null };
    const best = yearReturns.reduce((a, b) => (a.returnPct > b.returnPct ? a : b));
    const worst = yearReturns.reduce((a, b) => (a.returnPct < b.returnPct ? a : b));
    return { best, worst };
  }, [backtestData]);

  const displayCagr = useMemo(() => serverMetrics?.cagr ?? metrics?.cagr, [serverMetrics, metrics]);
  const displayMdd = useMemo(() => serverMetrics?.mdd ?? metrics?.mdd, [serverMetrics, metrics]);
  const displaySharpe = useMemo(() => serverMetrics?.sharpeRatio ?? metrics?.sharpeRatio, [serverMetrics, metrics]);
  const displayBeta = useMemo(() => serverMetrics?.beta ?? metrics?.beta, [serverMetrics, metrics]);
  const hasBenchmarkReturn = useMemo(() => metrics?.benchmarkReturn != null, [metrics]);
  const displayBestYear = useMemo(() => serverMetrics?.bestYearRate ?? yearlyStats.best?.returnPct, [serverMetrics, yearlyStats]);
  const displayWorstYear = useMemo(() => serverMetrics?.worstYearRate ?? yearlyStats.worst?.returnPct, [serverMetrics, yearlyStats]);

  useEffect(() => {
    if (config && config.strategy && !hasRun.current) {
      run({
        strategy: config.strategy,
        amount: config.amount,
        benchmarkTicker: config.benchmarkTicker,
        period: config.period,
        weights: config.weights,
        rebalancingPeriod: config.rebalancingPeriod,
        dividendReinvested: config.dividendReinvested,
      });
      hasRun.current = true;
    }
  }, [config, run]);

  if (!config) {
    return (
      <div className="page-shell page-content min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-xl font-bold mb-2">잘못된 접근입니다</div>
        <div className="text-muted-foreground mb-8">백테스트 설정 정보가 올바르지 않습니다.</div>
        <button
          onClick={() => navigate("/portfolio")}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold"
        >
          포트폴리오로 이동
        </button>
      </div>
    );
  }

  if (isLoading || (hasRun.current && !data && !isError)) {
    return (
      <div className="page-shell page-content py-6 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || (hasRun.current && !data)) {
    return (
      <div className="page-shell page-content min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">😵‍💫</div>
        <div className="text-xl font-bold mb-2">결과를 불러오지 못했어요</div>
        <div className="text-muted-foreground mb-8">서버와의 통신에 문제가 발생했습니다.</div>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="page-shell page-content min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">📊</div>
        <div className="text-xl font-bold mb-2">표시할 데이터가 부족해요</div>
        <div className="text-muted-foreground mb-8">
          선택한 기간({config.period}) 동안의 데이터가 없습니다.<br/>
          종목 상장일이 선택 기간보다 늦거나, 서버 데이터가 없는 상태입니다.
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  const { totalReturn, finalValue, outperformance } = metrics;
  
  return (
    <div className="min-h-screen bg-background pb-8 print:bg-white print:pb-0">
      <PageHeader 
        title="시뮬레이션 결과" 
        description="설정한 전략을 과거 데이터에 적용한 모바일 웹 리포트" 
        showBack 
        className="print:hidden"
        rightContent={
          <button 
            onClick={handlePrint}
            className="rounded-full p-2 transition-colors hover:bg-secondary"
            title="리포트 출력"
          >
            <Printer className="h-6 w-6 text-muted-foreground" />
          </button>
        }
      />

      <div className="page-shell page-content space-y-6 py-6 print:m-0 print:p-0">
        <section className="rounded-[32px] border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-card)),var(--color-card))] px-5 py-6 text-center shadow-[0_22px_56px_-42px_rgba(15,23,42,0.38)]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary">
              {config.strategy === "DCA" ? "적립식 투자" : "거치식 투자"}
            </Badge>
            {config.dividendReinvested && (
              <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary">
                배당금 재투자
              </Badge>
            )}
          </div>
          <div className="mb-2 font-medium text-muted-foreground">{(config.amount || 0).toLocaleString()}원이</div>
          <div className="mb-3 text-[length:var(--mobile-number-xl)] font-bold text-foreground md:text-5xl">₩ {finalValue.toLocaleString()}</div>
          <div className="mb-4 text-[2rem] font-bold text-up md:text-3xl">{totalReturn >= 0 ? "+" : ""}{totalReturn}%</div>
          <div className="font-medium text-muted-foreground">되었을 거예요!</div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="mb-1 text-sm font-medium text-muted-foreground">벤치마크 대비</div>
                <div className="text-lg font-bold text-foreground md:text-xl">{config.benchmarkTicker || "SPY"}보다</div>
              </div>
              <div className="text-right">
                {hasBenchmarkReturn ? (
                  <>
                    <div className="text-[1.75rem] font-bold text-up md:text-3xl">
                      {outperformance >= 0 ? "+" : ""}{outperformance.toFixed(1)}%
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">더 높은 수익</div>
                  </>
                ) : (
                  <div className="text-sm font-medium text-muted-foreground">벤치마크 데이터 없음</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <ChartSection backtestData={backtestData} />
        <AiCommentCard apiComment={aiComment} />

        <section className="rounded-[32px] border border-border bg-card px-5 py-6 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
          <div className="text-foreground mb-6 font-bold text-xl md:text-2xl">상세 성과 지표</div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="연평균 수익률" value={displayCagr != null ? `${displayCagr}%` : "-"} sub="CAGR" color="text-up" />
            <MetricCard label="최대 낙폭" value={displayMdd != null ? `${displayMdd}%` : "-"} sub="MDD" color="text-down" />
            <MetricCard label="위험 대비 수익" value={displaySharpe ?? "-"} sub="샤프 지수" />
            <MetricCard label="하락 변동성 대비 수익" value={metrics.sortinoRatio?.toString() ?? "0"} sub="소르티노 지수" />
            <MetricCard label="시장 민감도" value={displayBeta ?? "-"} sub="Beta" />
            <MetricCard label="최장 회복 기간" value={`${metrics.recoveryPeriod}일`} sub="Recovery" />
            {displayBestYear != null && (
              <MetricCard
                label={yearlyStats.best?.year ? `최고 연도 (${yearlyStats.best.year})` : "최고 연도"}
                value={`${displayBestYear > 0 ? "▲ " : "▼ "}${Math.abs(displayBestYear)}%`}
                sub="Best Year"
                color="text-up"
              />
            )}
            {displayWorstYear != null && (
              <MetricCard
                label={yearlyStats.worst?.year ? `최저 연도 (${yearlyStats.worst.year})` : "최저 연도"}
                value={`${displayWorstYear}%`}
                sub="Worst Year"
                color="text-down"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color = "text-foreground" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-secondary/30 p-4">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className={`mb-1 text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground opacity-60 uppercase tracking-wider">{sub}</div>
    </div>
  );
}

function ChartSection({ backtestData }: { backtestData: BacktestDailyResult[] }) {
  const chartData = useMemo(() => {
    return backtestData.map(d => ({
      date: d.date,
      value: d.totalValue,
      return: d.returnRate,
      bench: d.benchmarkReturnRate
    }));
  }, [backtestData]);

  if (chartData.length === 0) return null;

  return (
    <section className="rounded-[32px] border border-border bg-card p-2 shadow-sm overflow-hidden">
      <div className="p-5 pb-0">
        <div className="text-lg font-bold">수익률 추이</div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <XAxis dataKey="date" hide />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-2xl border border-border bg-card/90 p-3 shadow-xl backdrop-blur-md">
                      <div className="mb-1 text-xs text-muted-foreground">{data.date}</div>
                      <div className="text-sm font-bold text-up">수익률: {data.return.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">벤치마크: {data.bench.toFixed(1)}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="return" 
              stroke="var(--color-primary)" 
              strokeWidth={3} 
              dot={false}
              animationDuration={1500}
            />
            <Line 
              type="monotone" 
              dataKey="bench" 
              stroke="var(--color-muted-foreground)" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
              opacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AiCommentCard({ apiComment }: { apiComment: string | null }) {
  if (!apiComment) return null;

  return (
    <section className="rounded-[32px] border border-border bg-primary/5 px-5 py-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-primary/20 p-2 rounded-xl">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div className="font-bold text-lg">AI 투자 어드바이저의 분석</div>
      </div>
      <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
        {apiComment}
      </div>
    </section>
  );
}
