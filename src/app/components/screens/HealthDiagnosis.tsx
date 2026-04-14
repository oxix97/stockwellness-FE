import { Fragment } from "react";
import { useNavigate } from "react-router";
import { FlaskConical, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { usePortfolio, usePortfolioAdvice, usePortfolioCorrelation } from "@/hooks/use-portfolio";
import { Skeleton } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";
import { CorrelationMatrix, AdviceResponse } from "@/types/api";

export function HealthDiagnosis() {
  const navigate = useNavigate();
  const { health, isLoading: isPortfolioLoading } = usePortfolio();
  const advice = usePortfolioAdvice();
  const correlation = usePortfolioCorrelation();
  const isLoading = isPortfolioLoading || advice.isLoading || correlation.isLoading;

  if (isLoading) {
    return (
      <div className="page-shell page-content space-y-6 py-6">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader title="포트폴리오 건강 검진" description="내 포트폴리오 상태를 짧고 명확하게 읽는 리포트" showBack />

      <div className="page-shell page-content space-y-6 py-6">
        <ScoreCard score={health.overallScore} adviceContent={advice.data?.content} />
        <RadarSection data={health.radarData} />
        {correlation.data && <CorrelationSection matrix={correlation.data} />}
        <PrescriptionSection advice={advice.data} onBacktest={() => navigate("/backtest/setup")} />
      </div>
    </div>
  );
}

function ScoreCard({ score, adviceContent }: { score: number; adviceContent?: string }) {
  const getScoreTone = (value: number) => {
    if (value >= 80) return "text-primary";
    if (value >= 50) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <section className="overflow-hidden rounded-[32px] border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-card)),var(--color-card))] shadow-[0_22px_56px_-42px_rgba(15,23,42,0.38)]">
      <div className="border-b border-border/70 px-5 py-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Health report
        </div>
        <p className="mt-4 text-sm font-semibold text-muted-foreground">종합 건강 점수</p>
        <div className={`mt-1 text-[calc(var(--mobile-number-xl)+6px)] font-bold leading-none ${getScoreTone(score)}`}>{score}점</div>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          현재 포트폴리오 구조와 리스크 균형을 기준으로 오늘 가장 먼저 봐야 할 포인트를 정리했습니다.
        </p>
      </div>
      <div className="px-5 py-5">
        <div className="rounded-[24px] border border-border/60 bg-background/75 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">오늘의 해석</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {adviceContent || "데이터를 분석 중입니다..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RadarSection({ data }: { data: { metric: string; value: number }[] }) {
  return (
    <section className="rounded-[32px] border border-border bg-card px-5 py-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
      <div className="mb-5">
        <p className="text-lg font-bold text-foreground">건강 레이더 차트</p>
        <p className="mt-1 text-sm text-muted-foreground">어떤 항목이 강하고, 어떤 항목을 보완해야 하는지 한 번에 봅니다.</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }} />
            <Radar dataKey="value" stroke="#2EBE7A" fill="#2EBE7A" fillOpacity={0.25} strokeWidth={3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function CorrelationSection({ matrix }: { matrix: CorrelationMatrix }) {
  const tickers = Object.keys(matrix);

  const getColor = (value: number) => {
    if (value >= 0.7) return "bg-[#FF4756] text-white";
    if (value >= 0.3) return "bg-[#FF4756]/40 text-foreground";
    if (value >= -0.3) return "bg-secondary text-foreground";
    if (value >= -0.7) return "bg-[#3182F6]/40 text-foreground";
    return "bg-[#3182F6] text-white";
  };

  return (
    <section className="rounded-[32px] border border-border bg-card px-5 py-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
      <div className="mb-4">
        <p className="text-lg font-bold text-foreground">종목 간 상관관계</p>
        <p className="mt-1 text-sm text-muted-foreground">붉을수록 함께 움직이고, 푸를수록 분산 효과가 큽니다.</p>
      </div>
      <div className="relative">
        <div className="overflow-x-auto">
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `64px repeat(${tickers.length}, 56px)` }}>
            <div />
            {tickers.map((ticker) => (
              <div key={ticker} className="truncate px-1 text-center text-xs font-bold text-muted-foreground">
                {ticker}
              </div>
            ))}
            {tickers.map((rowTicker, rowIdx) => (
              <Fragment key={rowTicker}>
                <div key={rowTicker} className="flex items-center truncate text-xs font-bold text-muted-foreground">
                  {rowTicker}
                </div>
                {tickers.map((colTicker, colIdx) => {
                  if (rowIdx === colIdx) {
                    return (
                      <div key={colTicker} className="flex h-14 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        1.00
                      </div>
                    );
                  }
                  if (colIdx > rowIdx) {
                    return <div key={colTicker} className="h-14" />;
                  }
                  const value = matrix[rowTicker]?.[colTicker] ?? 0;
                  return (
                    <div key={colTicker} className={`flex h-14 items-center justify-center rounded-lg text-xs font-bold ${getColor(value)}`}>
                      {value.toFixed(2)}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-card to-transparent" />
      </div>
    </section>
  );
}

const ACTION_LABEL: Record<string, string> = {
  REBALANCE: "리밸런싱",
  RISK_MANAGEMENT: "리스크 관리",
  TECHNICAL_OPTIMIZATION: "기술적 최적화",
  DIVERSIFICATION: "포트폴리오 다각화",
};

function ActionBadge({ action }: { action?: string }) {
  if (!action) return null;
  const label = ACTION_LABEL[action] ?? action;

  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
      {label}
    </span>
  );
}

function PrescriptionSection({ advice, onBacktest }: { advice: AdviceResponse | undefined; onBacktest: () => void }) {
  return (
    <section className="rounded-[32px] border border-border bg-card px-5 py-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">AI의 처방전</p>
          <p className="text-sm text-muted-foreground">지금 바로 실행할 수 있는 다음 행동을 정리합니다.</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-border/70 bg-background/75 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">권장 조치</p>
          <ActionBadge action={advice?.action} />
        </div>
        <p className="text-sm leading-6 text-foreground">{advice?.content}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          생성일: {advice?.createdAt ? new Date(advice.createdAt).toLocaleString() : "-"}
        </p>
      </div>

      <button
        onClick={onBacktest}
        className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
      >
        <FlaskConical className="h-5 w-5" />
        이대로 과거 1년 백테스트 돌려보기
      </button>
    </section>
  );
}
