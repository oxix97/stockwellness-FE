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
        return null; // 필수 파라미터 누락
      }

      return {
        strategy,
        amount,
        benchmarkTicker: searchParams.get("benchmarkTicker") || "SPY",
        period: period || "1y",
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

  // useBacktest에 선택된 기간을 전달하여 클라이언트 사이드 슬라이싱 및 지표 계산 활성화
  const { run, data, isLoading, metrics, serverMetrics, isError, aiComment } = useBacktest(config?.period);

  useEffect(() => {
    if (config && config.strategy && !hasRun.current) {
      // 서버 로그 분석 결과 period 누락 확인 -> 명시적으로 포함
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

  // 설정값이 없거나 유효하지 않은 경우
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

  // 로딩 중이거나 아직 데이터가 없는 초기 상태 처리
  if (isLoading || (hasRun.current && !data && !isError)) {
    return (
      <div className="page-shell page-content py-6 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  // 서버 에러 발생 시 처리
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

  // 데이터는 로드되었으나 지표(metrics)가 계산되지 않은 경우 (빈 데이터 등)
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

  const backtestData = data?.dailyResults ?? [];

  // serverMetrics(BE 계산) 우선, 없으면 클라이언트 재계산값 사용
  const displayCagr = serverMetrics?.cagr ?? metrics?.cagr;
  const displayMdd = serverMetrics?.mdd ?? metrics?.mdd;
  const displaySharpe = serverMetrics?.sharpeRatio ?? metrics?.sharpeRatio;
  const displayBeta = serverMetrics?.beta ?? metrics?.beta;
  const hasBenchmarkReturn = metrics?.benchmarkReturn != null;

  // Best Year / Worst Year 계산
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

  const displayBestYear = serverMetrics?.bestYearRate ?? yearlyStats.best?.returnPct;
  const displayWorstYear = serverMetrics?.worstYearRate ?? yearlyStats.worst?.returnPct;

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
          <div className="mb-3 text-[length:var(--mobile-number-xl)] font-bold text-foreground md:text-5xl">₩ {metrics.finalValue.toLocaleString()}</div>
          <div className="mb-4 text-[2rem] font-bold text-up md:text-3xl">{metrics.totalReturn >= 0 ? "+" : ""}{metrics.totalReturn}%</div>
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
                      {metrics.outperformance >= 0 ? "+" : ""}{metrics.outperformance.toFixed(1)}%
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
          <MetricCard label="하락 변동성 대비 수익" value={metrics.sortinoRatio.toString()} sub="소르티노 지수" />
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

function ChartSection({ backtestData }: { backtestData: BacktestDailyResult[] }) {
  const data = backtestData ?? [];

  const hasBenchmarkData = data.some((r) => r.benchmarkReturnRate != null);

  const mddPeriod = useMemo(() => {
    if (data.length === 0) return { start: "", end: "" };
    let peak = data[0].totalValue;
    let peakDate = data[0].date;
    let mdd = 0;
    let mddStart = peakDate;
    let mddEnd = peakDate;
    for (const r of data) {
      if (r.totalValue > peak) {
        peak = r.totalValue;
        peakDate = r.date;
      }
      const drawdown = peak > 0 ? (r.totalValue - peak) / peak : 0;
      if (drawdown < mdd) {
        mdd = drawdown;
        mddStart = peakDate;
        mddEnd = r.date;
      }
    }
    return { start: mddStart, end: mddEnd };
  }, [data]);

  return (
    <section className="rounded-[32px] border border-border bg-card px-5 py-6 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
      <div className="flex items-center gap-2 mb-8">
        <Activity className="w-6 h-6 text-primary" />
        <div className="text-foreground font-bold text-lg md:text-xl">자산 성장 추이</div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fontWeight: 500 }}
              stroke="#9CA3AF"
              interval={Math.floor(data.length / 5) || 1}
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
            {mddPeriod.start && mddPeriod.end && mddPeriod.start !== mddPeriod.end && (
              <ReferenceArea x1={mddPeriod.start} x2={mddPeriod.end} fill="#3182F6" fillOpacity={0.08} strokeOpacity={0} />
            )}
            {hasBenchmarkData && (
              <Line type="monotone" dataKey="benchmarkReturnRate" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} name="벤치마크" />
            )}
            <Line type="monotone" dataKey="totalValue" stroke="#FF4756" strokeWidth={4} dot={false} name="내 포트폴리오" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AiCommentCard({ apiComment }: { apiComment: string | null }) {
  const comment = useMemo(() => {
    if (apiComment) return apiComment;
    return "백테스트 결과 분석 중입니다...";
  }, [apiComment]);

  return (
    <section className="rounded-[32px] border border-border bg-card px-5 py-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-foreground font-bold text-sm">AI 성과 코멘트</span>
        </div>
        <p className="text-foreground/80 text-sm leading-relaxed">{comment}</p>
      </div>
    </section>
  );
}

function MetricCard({ label, value, sub, color = "text-foreground" }: {
  label: string;
  value: string | number;
  sub: string;
  color?: string;
}) {
  return (
    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
      <div className="text-muted-foreground text-sm mb-2 font-medium">{label}</div>
      <div className={`${color} mb-1 font-bold text-[1.75rem] md:text-3xl`}>{value}</div>
      <div className="text-muted-foreground text-xs font-bold uppercase">{sub}</div>
    </div>
  );
}
