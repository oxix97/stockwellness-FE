import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  FlaskConical,
  PieChart,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Button,
  Skeleton,
} from "@/app/components/ui";
import { cn } from "@/app/components/ui/utils";
import { PortfolioBottomSheet, AnalysisType } from "@/app/components/portfolio/PortfolioBottomSheet";
import { PortfolioEditSheet } from "@/app/components/portfolio/PortfolioEditSheet";
import { PortfolioHoldingsSheet } from "@/app/components/portfolio/PortfolioHoldingsSheet";
import { PortfolioWizard } from "@/app/components/portfolio/wizard/PortfolioWizard";
import { usePortfolioAdvice, usePortfolioDetails, usePortfolioHealth, usePortfolioSummary } from "@/hooks/use-portfolio";
import { usePortfolioSimulation } from "@/hooks/use-backtest";
import { useAuthStore } from "@/store/auth";
import { PortfolioItemResponse, RebalancingItem } from "@/types/api";
import { calculateHealthBadge, calculateInvestorType } from "@/utils/calculate";
import { formatCurrency, formatDate } from "@/utils/format";
import { getTrendClassName } from "@/utils/trend";

const PERFORMANCE_OPTIONS = ["1M", "3M", "6M", "1Y"] as const;
type PerformancePeriod = (typeof PERFORMANCE_OPTIONS)[number];

const BENCHMARK_LABELS: Record<string, string> = {
  "2001": "코스피 200",
  SPX: "S&P 500",
  NDX: "나스닥 100",
  ".DJI": "다우존스 산업",
};

/**
 * 포트폴리오 메인 뷰
 * 핵심 인사이트를 메인에서 먼저 보여주고, 상세 분석은 바텀시트로 연결한다.
 */
export function Portfolio() {
  const navigate = useNavigate();
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const [showWizard, setShowWizard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHoldings, setShowHoldings] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [period] = useState<PerformancePeriod>("1Y");

  const summary = usePortfolioSummary();
  const healthQuery = usePortfolioHealth();
  const details = usePortfolioDetails();
  const adviceQuery = usePortfolioAdvice();
  const simulation = usePortfolioSimulation(period);

  if (!portfolioId) {
    return (
      <>
        <div className="page-shell page-content min-h-full flex flex-col items-center justify-center px-6 pb-20 pt-10 text-center">
          <div className="text-6xl mb-6">📊</div>
          <p className="text-foreground font-bold text-xl mb-2">
            나만의 자산 배분 포트폴리오를
            <br />
            만들어보세요
          </p>
          <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
            백테스트와 AI 분석으로
            <br />
            내 전략의 과거 성과를 확인하세요
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold"
          >
            포트폴리오 만들기
          </button>
        </div>
        {showWizard && <PortfolioWizard onClose={() => setShowWizard(false)} />}
      </>
    );
  }

  if (summary.isLoading || healthQuery.isLoading || details.isLoading) {
    return (
      <div className="page-shell page-content space-y-4 pt-4 md:pt-6">
        <Skeleton className="h-52 w-full rounded-[28px]" />
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  const valuation = summary.valuation;
  const rebalancingItems = summary.rebalancing?.items ?? [];
  const holdings = details.data?.items ?? [];
  const score = healthQuery.data?.overallScore;
  const healthBadge = calculateHealthBadge(score ?? 0);
  const investorType = calculateInvestorType(score);
  const topHoldings = [...holdings]
    .sort((a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0))
    .slice(0, 4);

  const symbolNames = Object.fromEntries(holdings.map((item) => [item.symbol, item.name || item.symbol]));

  const adviceSummary = getAdviceSummary(adviceQuery.data?.content);
  const insightCards = [
    {
      key: "rebalancing" as const,
      icon: Target,
      title: "리밸런싱 필요",
      value: `${rebalancingItems.length}개 종목`,
      description:
        rebalancingItems.length > 0
          ? `${rebalancingItems[0].name} ${rebalancingItems[0].recommendedQuantity > 0 ? "비중 확대" : "비중 축소"} 권장`
          : "현재 목표 비중과 큰 차이가 없습니다",
      tone: "bg-card border-border md:bg-amber-50/70 md:border-amber-200/70 dark:bg-card dark:border-border",
    },
    {
      key: "rebalancing" as const,
      icon: BrainCircuit,
      title: "AI 진단",
      value: adviceQuery.data?.action ?? "최신 분석 확인",
      description: adviceSummary,
      tone: "bg-card border-border md:bg-accent/70 md:border-primary/15 dark:bg-card dark:border-border",
    },
  ];

  // 성과 요약 비교 데이터 가공
  const inceptionDate = simulation.data?.portfolioInceptionDate;
  const dPlusDays = simulation.data?.daysElapsed ?? 0;
  const lastResult = simulation.data?.dailyResults?.[simulation.data.dailyResults.length - 1];
  const myTotalReturn = lastResult?.portfolioReturnRate ?? 0;
  const comparisons = simulation.data?.comparisons ?? [];

  return (
    <div className="min-h-full pb-10">
      <section className="page-shell page-content pt-4 md:pt-6">
        <div className="relative overflow-hidden rounded-[var(--mobile-card-radius)] border border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_18%,transparent),color-mix(in_srgb,var(--color-card)_96%,transparent)_42%,color-mix(in_srgb,var(--color-accent)_88%,transparent)_100%)] p-[var(--mobile-header-padding-x)] shadow-[0_18px_50px_-32px_color-mix(in_srgb,var(--color-primary)_38%,transparent)] dark:border-primary/20 dark:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_20%,transparent),color-mix(in_srgb,var(--color-card)_94%,transparent)_42%,color-mix(in_srgb,var(--color-accent)_60%,transparent)_100%)] md:rounded-[28px] md:p-6 xl:p-7">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-primary/14 blur-2xl" />
            <div className="absolute right-8 top-7 h-20 w-20 rounded-full border border-primary/10" />
            <div className="absolute right-16 top-16 h-px w-16 bg-gradient-to-r from-primary/50 to-transparent rotate-45" />
            <div className="absolute left-5 top-5 h-px w-20 bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <button className="relative z-10 flex items-center gap-1">
              <span className="text-foreground font-semibold text-sm">내 포트폴리오</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="relative z-10 rounded-full border border-border/70 bg-card/80 p-2 text-muted-foreground transition-colors hover:bg-card"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 mt-5 flex items-start justify-between gap-3 xl:items-end">
            <div>
              <p className="text-muted-foreground text-xs mb-1">총 자산</p>
              <p className="text-foreground font-bold text-[length:var(--mobile-number-xl)] leading-none tracking-tight tabular-nums md:text-[36px]">
                ₩{formatCurrency(valuation?.currentTotalValue ?? 0)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={getToneClassName(valuation?.totalReturnRate ?? 0, "text-sm font-semibold tabular-nums")}>
                  ₩{formatCurrency(Math.abs(valuation?.totalProfitLoss ?? 0))} {Math.abs(valuation?.totalReturnRate ?? 0).toFixed(2)}%
                </span>
                <span className="text-muted-foreground text-xs">누적</span>
                <span className="text-border">•</span>
                <span className={getToneClassName(valuation?.dailyReturnRate ?? 0, "text-xs tabular-nums")}>
                  오늘 ₩{formatCurrency(Math.abs(valuation?.dailyProfitLoss ?? 0))} {Math.abs(valuation?.dailyReturnRate ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${healthBadge.color}`}>
              {healthBadge.label}
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2.5 min-[408px]:grid-cols-3 min-[408px]:[&>*:last-child]:col-span-1 xl:max-w-xl [&>*:last-child]:col-span-2">
            <HeroMetric label="건강 점수" value={score !== undefined ? `${score.toFixed(0)}점` : "-"} accent />
            <HeroMetric label="Sharpe" value={(valuation?.sharpeRatio ?? 0).toFixed(2)} />
            <HeroMetric label="MDD" value={`${(valuation?.mdd ?? 0).toFixed(1)}%`} />
          </div>

          <div className="relative z-10 mt-4 flex items-center gap-2 rounded-[calc(var(--mobile-card-radius)-2px)] border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur-sm md:rounded-2xl md:py-3">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${investorType.color}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{investorType.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {healthQuery.data?.nextSteps?.[0] ?? "다음 점검 포인트를 확인해보세요."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell page-content pt-6">
        <div className="rounded-[32px] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-bold text-base">성과 요약 비교</p>
                {inceptionDate && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                      시작일: {formatDate(inceptionDate)} (D+{dPlusDays})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <PerformanceBar 
              label="내 포트폴리오" 
              value={myTotalReturn} 
              isPortfolio 
              maxAbsValue={Math.max(Math.abs(myTotalReturn), ...comparisons.map(c => Math.abs(c.totalReturn)))}
            />
            
            <div className="pt-2 space-y-4 border-t border-border/50">
              {comparisons.map((comp) => (
                <PerformanceBar 
                  key={comp.ticker}
                  label={BENCHMARK_LABELS[comp.ticker] || comp.indexName} 
                  value={comp.totalReturn} 
                  maxAbsValue={Math.max(Math.abs(myTotalReturn), ...comparisons.map(c => Math.abs(c.totalReturn)))}
                />
              ))}
              {comparisons.length === 0 && (
                <p className="text-center py-4 text-xs text-muted-foreground italic">
                  비교할 벤치마크 데이터가 없습니다.
                </p>
              )}
            </div>

            {comparisons.length > 0 && (
              <div className="mt-6 rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  <span className="font-bold text-primary">
                    {(() => {
                      const betterThan = comparisons.filter(c => myTotalReturn > c.totalReturn);
                      if (betterThan.length === comparisons.length) {
                        return "모든 주요 지수보다 높은 성과를 내고 있습니다! ✨";
                      } else if (betterThan.length > 0) {
                        const bestBench = betterThan.sort((a, b) => b.totalReturn - a.totalReturn)[0];
                        const diff = (myTotalReturn - bestBench.totalReturn).toFixed(1);
                        return `${BENCHMARK_LABELS[bestBench.ticker] || bestBench.indexName}보다 ${diff}% 더 높은 수익을 기록 중이에요! 🚀`;
                      } else {
                        const bestOverall = [...comparisons].sort((a, b) => b.totalReturn - a.totalReturn)[0];
                        const diff = (bestOverall.totalReturn - myTotalReturn).toFixed(1);
                        return `${BENCHMARK_LABELS[bestOverall.ticker] || bestOverall.indexName} 대비 ${diff}% 차이로 바짝 추격하고 있어요. 🔥`;
                      }
                    })()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="page-shell page-content grid gap-6 pt-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
        <div className="space-y-6">
          <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-bold text-base">지금 확인할 인사이트</p>
              <p className="text-muted-foreground text-xs">행동이 필요한 신호를 먼저 보여줍니다.</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {insightCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={`${card.title}-${card.description}`}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setAnalysisType(card.key)}
                  className={`relative w-full overflow-hidden rounded-3xl border p-4 text-left ${card.tone}`}
                >
                  <div className="pointer-events-none absolute right-0 top-0 h-16 w-20 bg-gradient-to-bl from-primary/10 to-transparent" />
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-2.5 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">{card.title}</p>
                          <p className="mt-0.5 text-base font-bold text-foreground">{card.value}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{card.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-foreground font-bold text-base">핵심 보유 종목</p>
                <p className="text-muted-foreground text-xs">영향도가 큰 종목부터 보여줍니다.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowHoldings(true)} className="text-xs">
                전체 보기
              </Button>
            </div>

            {topHoldings.length > 0 ? (
              <div className="divide-y divide-border">
                {topHoldings.map((item) => (
                  <HoldingRow
                    key={item.symbol}
                    item={item}
                    contribution={summary.itemContributions?.[item.symbol]}
                    rebalancingNote={getRebalancingNote(item.symbol, rebalancingItems)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">보유 종목이 없습니다.</div>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-foreground font-bold text-base">추가 분석</p>
              <p className="text-muted-foreground text-xs">성과 검증과 핵심 보조 분석으로 바로 이동합니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SecondaryActionCard
                icon={FlaskConical}
                title="성과 시뮬레이션"
                description="과거 성과 백테스트"
                onClick={() => navigate("/backtest/setup")}
              />
              <SecondaryActionCard
                icon={PieChart}
                title="분산도 분석"
                description="자산군, 섹터, 국가 비중"
                onClick={() => setAnalysisType("diversification")}
              />
              <SecondaryActionCard
                icon={Activity}
                title="상관관계"
                description={`${Object.keys(symbolNames).length}개 종목 위험 분산`}
                onClick={() => setAnalysisType("correlation")}
                className="col-span-2"
              />
            </div>
          </section>
        </div>
      </div>

      <PortfolioBottomSheet
        isOpen={analysisType !== null}
        onClose={() => setAnalysisType(null)}
        type={analysisType}
      />

      {showEdit && <PortfolioEditSheet isOpen={showEdit} onClose={() => setShowEdit(false)} />}
      {showHoldings && <PortfolioHoldingsSheet isOpen={showHoldings} onClose={() => setShowHoldings(false)} />}
      {showWizard && <PortfolioWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}

function HeroMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-[calc(var(--mobile-card-radius)-2px)] border px-3 py-3 md:rounded-2xl ${accent ? "border-primary/20 bg-card" : "border-border/70 bg-card/70"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function PerformanceBar({ 
  label, 
  value, 
  isPortfolio = false, 
  maxAbsValue 
}: { 
  label: string; 
  value: number; 
  isPortfolio?: boolean; 
  maxAbsValue: number;
}) {
  const percentage = maxAbsValue > 0 ? (Math.abs(value) / maxAbsValue) * 100 : 0;
  const isPositive = value > 0;
  const isZero = value === 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", isPortfolio ? "text-foreground font-bold" : "text-muted-foreground")}>
          {label}
        </span>
        <span className={cn("font-bold tabular-nums", isZero ? "text-muted-foreground/50" : getTrendClassName(value))}>
          {Math.abs(value).toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
        {isZero ? (
          <div className="h-full w-[2px] bg-muted-foreground/20 rounded-full" />
        ) : (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(percentage, 2)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isPortfolio ? "bg-primary" : isPositive ? "bg-up/60" : "bg-down/60"
            )}
          />
        )}
      </div>
    </div>
  );
}

function HoldingRow({
  item,
  contribution,
  rebalancingNote,
}: {
  item: PortfolioItemResponse;
  contribution?: number;
  rebalancingNote: string;
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.name || item.symbol}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.symbol} · {item.quantity}주
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground tabular-nums">
            ₩{formatCurrency(item.currentValue ?? 0)}
          </p>
          <p className={getToneClassName(item.returnRate ?? 0, "text-xs tabular-nums")}>
            {Math.abs(item.returnRate ?? 0).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <InlineChip label="목표 비중" value={`${item.targetWeight}%`} />
        {contribution !== undefined && <InlineChip label="기여도" value={`${contribution.toFixed(0)}%`} />}
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
          {rebalancingNote}
        </span>
      </div>
    </div>
  );
}

function InlineChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      {label} <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

function SecondaryActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: {
  icon: typeof PieChart;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn("rounded-3xl border border-border bg-card p-4 text-left", className)}
    >
      <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-2 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </motion.button>
  );
}

function getToneClassName(value: number, baseClassName: string) {
  return `${baseClassName} ${getTrendClassName(value, { neutral: "text-foreground" })}`;
}

function getAdviceSummary(content: string | undefined) {
  if (!content) return "최신 AI 분석을 불러와 포트폴리오 방향을 점검해보세요.";
  const normalized = content.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] ?? normalized;
  return firstSentence.length > 72 ? `${firstSentence.slice(0, 72)}…` : firstSentence;
}

function getRebalancingNote(symbol: string, rebalancingItems: RebalancingItem[] | undefined) {
  const target = rebalancingItems?.find((item) => item.symbol === symbol);
  if (!target) return "비중 유지";
  return target.recommendedQuantity > 0 ? "비중 확대" : "비중 축소";
}
