import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Activity, Printer, Sparkles } from "lucide-react";
import { ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useBacktest } from "@/hooks/use-backtest";
import {
  BacktestDailyResult,
  BacktestRouteState,
  BenchmarkCode,
  isBacktestRouteState,
} from "@/types/api";
import { Badge, Skeleton } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { formatDate } from "@/utils/format";

const BENCHMARK_LABELS: Record<BenchmarkCode, string> = {
  KOSPI: "KOSPI",
  KOSDAQ: "KOSDAQ",
  SP500: "S&P500",
};

function metricValue(value: number | null | undefined, fractionDigits = 1): ReactNode {
  if (value == null || !Number.isFinite(value)) return "데이터 없음";
  return <SignedValueLabel value={value} format="percent" fractionDigits={fractionDigits} />;
}

function numberValue(value: number | null | undefined, fractionDigits = 2): ReactNode {
  if (value == null || !Number.isFinite(value)) return "데이터 없음";
  return value.toFixed(fractionDigits);
}

function routeStateFromLocation(state: unknown): BacktestRouteState | null {
  return isBacktestRouteState(state) ? state : null;
}

export function BacktestResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = useMemo(() => routeStateFromLocation(location.state), [location.state]);
  const hasRun = useRef(false);
  const {
    run,
    data,
    isLoading,
    metrics,
    serverMetrics,
    comparison,
    isError,
    errorCode,
    aiComment,
  } = useBacktest(config?.period);

  useEffect(() => {
    if (config && !hasRun.current) {
      run(config);
      hasRun.current = true;
    }
  }, [config, run]);

  if (!config) return <Navigate to="/backtest/setup" replace />;

  const retry = () => {
    hasRun.current = true;
    run(config);
  };

  if (isLoading || (hasRun.current && !data && !isError)) {
    return (
      <div className="page-shell page-content min-h-screen space-y-8 py-6" aria-label="백테스트 결과 로딩 중">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || (hasRun.current && !data)) {
    const isMissingEod = errorCode === "S002";
    return (
      <div className="page-shell page-content flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 text-6xl" aria-hidden="true">{isMissingEod ? "📅" : "😵‍💫"}</div>
        <div className="mb-2 text-xl font-bold">{isMissingEod ? "EOD 시세 데이터가 부족해요" : "결과를 불러오지 못했어요"}</div>
        <div className="mb-8 max-w-md text-muted-foreground">
          {isMissingEod
            ? "선택한 기간의 EOD 시세 데이터가 부족합니다. 기간 또는 벤치마크를 변경해 다시 시도해주세요."
            : "서버와의 통신에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3 min-[421px]:flex-row">
          <button type="button" onClick={retry} className="flex-1 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">
            다시 시도
          </button>
          <button type="button" onClick={() => navigate("/backtest/setup")} className="flex-1 rounded-xl border border-border bg-card px-6 py-3 font-bold text-foreground">
            설정 변경
          </button>
        </div>
      </div>
    );
  }

  if (!data || !metrics || data.dailyResults.length === 0) {
    return (
      <div className="page-shell page-content flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 text-6xl" aria-hidden="true">📊</div>
        <div className="mb-2 text-xl font-bold">표시할 데이터가 부족해요</div>
        <div className="mb-8 text-muted-foreground">선택한 기간({config.period}) 동안의 EOD 데이터가 없습니다.</div>
        <button type="button" onClick={() => navigate("/backtest/setup")} className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground">
          설정 변경
        </button>
      </div>
    );
  }

  const benchmarkCode = data.primaryBenchmark;
  const benchmarkLabel = BENCHMARK_LABELS[benchmarkCode] ?? benchmarkCode;
  const strategyMetricLabel = config.strategy === "DCA" ? "현금흐름 연환산 수익률" : "연평균 복리 수익률";
  const strategyMetricCode = config.strategy === "DCA" ? "XIRR" : "CAGR";
  const finalValue = metrics.finalValue == null ? "데이터 없음" : `₩ ${metrics.finalValue.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background pb-8 print:bg-white print:pb-0">
      <PageHeader
        title="시뮬레이션 결과"
        description="EOD 시세로 계산한 전략별 백테스트 리포트"
        showBack
        className="print:hidden"
        rightContent={(
          <button type="button" onClick={() => window.print()} className="rounded-full p-2 transition-colors hover:bg-secondary" title="리포트 출력" aria-label="리포트 출력">
            <Printer className="h-6 w-6 text-muted-foreground" />
          </button>
        )}
      />

      <div className="page-shell page-content space-y-6 py-6 print:m-0 print:p-0">
        <section className="rounded-[32px] border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-card)),var(--color-card))] px-5 py-6 text-center shadow-[0_22px_56px_-42px_rgba(15,23,42,0.38)]">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="border-primary/20 bg-background/50 text-primary">
              {config.strategy === "DCA" ? "적립식 투자" : "거치식 투자"}
            </Badge>
            <Badge variant="outline" className="border-primary/20 bg-background/50 text-primary">{benchmarkLabel}</Badge>
            {config.dividendReinvested && <Badge variant="outline" className="border-primary/20 bg-background/50 text-primary">배당금 재투자</Badge>}
          </div>
          <div className="mb-2 font-medium text-muted-foreground">{config.amount.toLocaleString()}원이</div>
          <div className="mb-3 text-[length:var(--mobile-number-xl)] font-bold text-foreground md:text-5xl">{finalValue}</div>
          <div className="mb-4 text-[2rem] font-bold md:text-3xl">{metricValue(metrics.totalReturn)}</div>
          <div className="font-medium text-muted-foreground">되었을 거예요!</div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="mb-1 text-sm font-medium text-muted-foreground">벤치마크 대비</div>
                <div className="text-lg font-bold text-foreground md:text-xl">{benchmarkLabel}</div>
              </div>
              <div className="text-right">
                <div className="text-[1.75rem] font-bold md:text-3xl">{metricValue(metrics.outperformance)}</div>
                <div className="text-sm font-medium text-muted-foreground">초과 수익률 (Alpha)</div>
              </div>
            </div>
          </div>
        </section>

        <ChartSection backtestData={data.dailyResults} primaryBenchmark={benchmarkCode} primaryBenchmarkLabel={benchmarkLabel} />
        <AiCommentCard apiComment={aiComment} />

        <section className="rounded-[32px] border border-border bg-card px-5 py-6 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
          <div className="mb-6 flex items-baseline justify-between gap-3">
            <div className="text-xl font-bold text-foreground md:text-2xl">상세 성과 지표</div>
            <div className="text-xs text-muted-foreground">{serverMetrics?.primaryBenchmark ?? benchmarkCode}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label={strategyMetricLabel} value={metricValue(config.strategy === "DCA" ? metrics.xirr : metrics.cagr)} sub={strategyMetricCode} />
            <MetricCard label="시간가중수익률" value={metricValue(metrics.timeWeightedReturnRate)} sub="TWR" />
            <MetricCard label="최대 낙폭" value={metricValue(metrics.mdd)} sub="MDD" />
            <MetricCard label="상대 낙폭" value={metricValue(metrics.relativeMdd)} sub="Relative MDD" />
            <MetricCard label="위험 대비 수익" value={numberValue(metrics.sharpeRatio)} sub="Sharpe" />
            <MetricCard label="하락 변동성 대비 수익" value={numberValue(metrics.sortinoRatio)} sub="Sortino" />
            <MetricCard label="시장 민감도" value={numberValue(metrics.beta)} sub={`Beta · ${benchmarkLabel}`} />
            <MetricCard label="초과 수익률" value={metricValue(metrics.alpha)} sub={`Alpha · ${benchmarkLabel}`} />
            <MetricCard label="최장 회복 기간" value={metrics.recoveryPeriod == null ? "데이터 없음" : `${metrics.recoveryPeriod}일`} sub="Recovery" />
          </div>
          {comparison && <p className="mt-5 text-xs text-muted-foreground">{comparison.indexName} 비교 지표는 선택한 primary benchmark 기준입니다.</p>}
        </section>

        <button type="button" onClick={() => navigate("/backtest/setup")} className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-center font-bold text-foreground shadow-sm transition-colors hover:bg-secondary">
          설정 변경
        </button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          EOD 종가 기준 참고 결과이며 실제 거래의 수수료·세금과 차이가 날 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: ReactNode; sub: string }) {
  return (
    <div className="rounded-2xl bg-secondary/30 p-4">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mb-1 text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-60">{sub}</div>
    </div>
  );
}

function ChartSection({
  backtestData,
  primaryBenchmark,
  primaryBenchmarkLabel,
}: {
  backtestData: BacktestDailyResult[];
  primaryBenchmark: BenchmarkCode;
  primaryBenchmarkLabel: string;
}) {
  const chartData = useMemo(() => backtestData.map((daily) => ({
    date: daily.date,
    returnRate: daily.returnRate,
    benchmarkReturnRate: daily.benchmarkReturnRates?.[primaryBenchmark] ?? daily.benchmarkReturnRate,
  })), [backtestData, primaryBenchmark]);

  if (chartData.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[32px] border border-border bg-card p-2 shadow-sm" aria-label="백테스트 수익률 차트">
      <div className="p-5 pb-0">
        <div className="text-lg font-bold">수익률 추이</div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="차트 범례">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />내 포트폴리오</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground" />{primaryBenchmarkLabel}</span>
        </div>
      </div>
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <XAxis dataKey="date" hide />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0].payload as { date: string; returnRate: number; benchmarkReturnRate: number | null };
                return (
                  <div className="rounded-2xl border border-border bg-card/90 p-3 shadow-xl backdrop-blur-md">
                    <div className="mb-1 text-xs text-muted-foreground">{formatDate(point.date)}</div>
                    <div className="text-sm font-bold">내 포트폴리오: {metricValue(point.returnRate)}</div>
                    <div className="text-xs">{primaryBenchmarkLabel}: {metricValue(point.benchmarkReturnRate)}</div>
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="returnRate" name="내 포트폴리오" stroke="var(--color-primary)" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="benchmarkReturnRate" name={primaryBenchmarkLabel} stroke="var(--color-muted-foreground)" strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.5} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AiCommentCard({ apiComment }: { apiComment: string | null }) {
  if (!apiComment) return null;
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border bg-primary/5 px-5 py-6 shadow-sm">
      <div className="absolute right-0 top-0 p-4 opacity-10"><Sparkles className="h-12 w-12 text-primary" /></div>
      <div className="mb-4 flex items-center gap-2"><div className="rounded-xl bg-primary/20 p-2"><Activity className="h-5 w-5 text-primary" /></div><div className="text-lg font-bold">AI 투자 어드바이저의 분석</div></div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 md:text-base">{apiComment}</div>
    </section>
  );
}
