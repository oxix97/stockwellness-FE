import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  PieChart,
  RefreshCcw,
  Orbit,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Button,
  Skeleton,
} from "@/app/components/ui";
import { PortfolioBottomSheet, AnalysisType } from "@/app/components/portfolio/PortfolioBottomSheet";
import { PortfolioEditSheet } from "@/app/components/portfolio/PortfolioEditSheet";
import { PortfolioHoldingsSheet } from "@/app/components/portfolio/PortfolioHoldingsSheet";
import { PortfolioWizard } from "@/app/components/portfolio/wizard/PortfolioWizard";
import { usePortfolioAdvice, usePortfolioDetails, usePortfolioHealth, usePortfolioSummary } from "@/hooks/use-portfolio";
import { computeMetrics, usePortfolioSimulation } from "@/hooks/use-backtest";
import { useAuthStore } from "@/store/auth";
import { PortfolioItemResponse, RebalancingItem } from "@/types/api";
import { calculateHealthBadge, calculateInvestorType } from "@/utils/calculate";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";

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
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const [showWizard, setShowWizard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHoldings, setShowHoldings] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [period, setPeriod] = useState<PerformancePeriod>("1Y");

  const summary = usePortfolioSummary();
  const healthQuery = usePortfolioHealth();
  const details = usePortfolioDetails();
  const adviceQuery = usePortfolioAdvice();
  const simulation = usePortfolioSimulation(period);

  if (!portfolioId) {
    return (
      <>
        <div className="min-h-full flex flex-col items-center justify-center px-6 pb-20 text-center">
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
            📊 포트폴리오 만들기
          </button>
        </div>
        {showWizard && <PortfolioWizard onClose={() => setShowWizard(false)} />}
      </>
    );
  }

  if (summary.isLoading || healthQuery.isLoading || details.isLoading) {
    return (
      <div className="p-4 space-y-4">
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
  const simulationMetrics = computeMetrics(simulation.data?.dailyResults);
  const topHoldings = [...holdings]
    .sort((a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0))
    .slice(0, 4);

  const symbolNames = Object.fromEntries(holdings.map((item) => [item.symbol, item.name || item.symbol]));

  const chartData =
    simulation.data?.dailyResults.map((result) => ({
      date: formatDate(result.date),
      portfolio: Number((result.portfolioReturnRate ?? 0).toFixed(2)),
      ...Object.fromEntries(
        Object.entries(result.benchmarkReturnRates ?? {}).map(([ticker, value]) => [
          ticker,
          Number(value.toFixed(2)),
        ])
      ),
    })) ?? [];

  const leadingBenchmark = simulation.data?.comparisons?.[0];
  const leadingBenchmarkLabel = leadingBenchmark
    ? leadingBenchmark.indexName || BENCHMARK_LABELS[leadingBenchmark.ticker] || leadingBenchmark.ticker
    : "벤치마크 없음";
  const adviceSummary = getAdviceSummary(adviceQuery.data?.content);
  const insightCards = [
    {
      key: "rebalancing" as const,
      icon: Target,
      title: "리밸런싱 필요",
      value: `${rebalancingItems.length}개 종목`,
      description:
        rebalancingItems.length > 0
          ? `${rebalancingItems[0].name} ${rebalancingItems[0].recommendQuantity > 0 ? "비중 확대" : "비중 축소"} 권장`
          : "현재 목표 비중과 큰 차이가 없습니다",
      tone: "bg-card border-border md:bg-amber-50/70 md:border-amber-200/70 dark:bg-card dark:border-border",
    },
    {
      key: "backtest" as const,
      icon: TrendingUp,
      title: "성과 비교",
      value:
        simulationMetrics && Number.isFinite(simulationMetrics.outperformance)
          ? `${simulationMetrics.outperformance >= 0 ? "+" : ""}${simulationMetrics.outperformance}%p`
          : "데이터 준비 중",
      description:
        simulationMetrics
          ? `${leadingBenchmarkLabel} 대비 ${simulationMetrics.outperformance >= 0 ? "초과 성과" : "열세"}`
          : "성과 비교 데이터를 불러오는 중입니다",
      tone: "bg-card border-border md:bg-primary/8 md:border-primary/20 dark:bg-card dark:border-border",
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

  return (
    <div className="min-h-full pb-10">
      <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_18%,transparent),color-mix(in_srgb,var(--color-card)_96%,transparent)_42%,color-mix(in_srgb,var(--color-accent)_88%,transparent)_100%)] p-5 shadow-[0_18px_50px_-32px_color-mix(in_srgb,var(--color-primary)_38%,transparent)] dark:border-primary/20 dark:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_20%,transparent),color-mix(in_srgb,var(--color-card)_94%,transparent)_42%,color-mix(in_srgb,var(--color-accent)_60%,transparent)_100%)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 -top-8 h-28 w-28 rounded-full bg-primary/14 blur-2xl" />
            <div className="absolute right-8 top-7 h-20 w-20 rounded-full border border-primary/10" />
            <div className="absolute right-16 top-16 h-px w-16 bg-gradient-to-r from-primary/50 to-transparent rotate-45" />
            <div className="absolute left-5 top-5 h-px w-20 bg-gradient-to-r from-primary/40 to-transparent" />
            <div className="absolute bottom-5 right-5 rounded-2xl border border-border/50 bg-card/66 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Orbit className="h-3 w-3 text-primary" />
                Portfolio Core
              </div>
              <p className="mt-1 text-sm font-bold text-foreground">{holdings.length} holdings</p>
            </div>
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

          <div className="relative z-10 mt-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs mb-1">총 자산</p>
              <p className="text-foreground font-bold text-[32px] leading-none tracking-tight tabular-nums">
                ₩{formatCurrency(valuation?.currentTotalValue ?? 0)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={getToneClassName(valuation?.totalReturnRate ?? 0, "text-sm font-semibold tabular-nums")}>
                  {formatSignedCurrency(valuation?.totalProfitLoss ?? 0)} {formatPercent(valuation?.totalReturnRate ?? 0)}
                </span>
                <span className="text-muted-foreground text-xs">누적</span>
                <span className="text-border">•</span>
                <span className={getToneClassName(valuation?.dailyReturnRate ?? 0, "text-xs tabular-nums")}>
                  오늘 {formatSignedCurrency(valuation?.dailyProfitLoss ?? 0)} {formatPercent(valuation?.dailyReturnRate ?? 0)}
                </span>
              </div>
            </div>
            <div className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${healthBadge.color}`}>
              {healthBadge.label}
            </div>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-3 gap-2.5">
            <HeroMetric label="건강 점수" value={score !== undefined ? `${score.toFixed(0)}점` : "-"} accent />
            <HeroMetric label="Sharpe" value={(valuation?.sharpeRatio ?? 0).toFixed(2)} />
            <HeroMetric label="MDD" value={`${(valuation?.mdd ?? 0).toFixed(1)}%`} />
          </div>

          <div className="relative z-10 mt-4 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-3 backdrop-blur-sm">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${investorType.color}`} />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground">{investorType.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {healthQuery.data?.nextSteps?.[0] ?? "핵심 포트폴리오 인사이트를 확인해보세요."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="p-4 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-bold text-base">지금 확인할 인사이트</p>
              <p className="text-muted-foreground text-xs">행동이 필요한 신호를 먼저 보여줍니다.</p>
            </div>
          </div>

          <div className="space-y-3">
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
                          <p className="text-[11px] font-semibold text-muted-foreground">{card.title}</p>
                          <p className="mt-0.5 text-base font-bold text-foreground">{card.value}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{card.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">signal card</span>
                        <span className="rounded-full border border-border/60 bg-card/80 px-2 py-1 text-[10px] font-medium text-foreground">
                          열어보기
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-foreground font-bold text-base">성과 비교</p>
              <p className="mt-1 text-xs text-muted-foreground">
                포트폴리오 생성일 이후 누적 수익률을 비교합니다.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAnalysisType("backtest")} className="text-xs">
              상세 보기
            </Button>
          </div>

          <div className="mt-4 flex gap-1 rounded-2xl bg-secondary p-1">
            {PERFORMANCE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setPeriod(option)}
                className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                  period === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] bg-background/70 p-3">
            {simulation.isLoading ? (
              <Skeleton className="h-[220px] rounded-2xl" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickFormatter={(value) => `${value}%`}
                    tickLine={false}
                    axisLine={false}
                    width={34}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`,
                      name === "portfolio" ? "내 포트폴리오" : BENCHMARK_LABELS[name] || name,
                    ]}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 12,
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      color: "var(--color-card-foreground)",
                    }}
                  />
                  <Line type="monotone" dataKey="portfolio" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  {simulation.data?.comparisons.map((comparison, index) => (
                    <Line
                      key={comparison.ticker}
                      type="monotone"
                      dataKey={comparison.ticker}
                      stroke={[
                        "var(--color-chart-2)",
                        "var(--color-chart-4)",
                        "var(--color-chart-3)",
                        "var(--color-muted-foreground)",
                      ][index % 4]}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                생성 시점 성과 데이터가 없습니다.
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <PerformanceMetric label="누적 수익률" value={simulationMetrics ? formatPercent(simulationMetrics.totalReturn) : "-"} />
            <PerformanceMetric
              label="벤치마크 대비"
              value={
                simulationMetrics
                  ? `${simulationMetrics.outperformance >= 0 ? "+" : ""}${simulationMetrics.outperformance}%p`
                  : "-"
              }
              positive={(simulationMetrics?.outperformance ?? 0) >= 0}
            />
            <PerformanceMetric label="CAGR" value={simulationMetrics ? `${simulationMetrics.cagr}%` : "-"} />
          </div>
        </section>

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
            <p className="text-muted-foreground text-xs">필요할 때 깊게 보는 보조 분석입니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            />
          </div>
        </section>
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
    <div className={`rounded-2xl border px-3 py-3 ${accent ? "border-primary/20 bg-card" : "border-border/70 bg-card/70"}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function PerformanceMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/50 px-3 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${positive === undefined ? "text-foreground" : positive ? "text-up" : "text-down"}`}>
        {value}
      </p>
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
            {formatPercent(item.returnRate ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <InlineChip label="목표 비중" value={`${item.targetWeight}%`} />
        {contribution !== undefined && <InlineChip label="기여도" value={`${contribution.toFixed(0)}%`} />}
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
          {rebalancingNote}
        </span>
      </div>
    </div>
  );
}

function InlineChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
      {label} <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

function SecondaryActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof PieChart;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="rounded-3xl border border-border bg-card p-4 text-left"
    >
      <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-2 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </motion.button>
  );
}

function formatSignedCurrency(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}₩${formatCurrency(Math.abs(value))}`;
}

function getToneClassName(value: number, baseClassName: string) {
  if (value > 0) return `${baseClassName} text-up`;
  if (value < 0) return `${baseClassName} text-down`;
  return `${baseClassName} text-foreground`;
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
  return target.recommendQuantity > 0 ? "비중 확대" : "비중 축소";
}
