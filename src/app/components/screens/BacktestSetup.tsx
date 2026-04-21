import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router";
import { FlaskConical, Sparkles } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useAuthStore } from "@/store/auth";
import { Skeleton, Slider, Switch, Label } from "@/app/components/ui";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { PageHeader } from "@/app/components/shared";

const periods = [
  { id: "1M", label: "최근 1개월" },
  { id: "3M", label: "최근 3개월" },
  { id: "6M", label: "최근 6개월" },
  { id: "1Y", label: "최근 1년" },
];

const strategies = [
  { id: "DCA", label: "적립식 (DCA)", description: "매달 일정 금액을 추가 투자" },
  { id: "LUMP_SUM", label: "거치식 (Lump Sum)", description: "한 번에 전액 투자" },
];

const rebalancing = [
  { id: "NONE", label: "안 함" },
  { id: "MONTHLY", label: "매월" },
  { id: "QUARTERLY", label: "매 분기" },
  { id: "YEARLY", label: "매년" },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00C49F", "#FFBB28", "#FF8042"];

export function BacktestSetup() {
  const navigate = useNavigate();
  const portfolioId = useAuthStore((s) => s.portfolioId);
  const { holdings, isLoading } = usePortfolio();

  // ── 훅은 조건부 return 이전에 모두 선언 ──────────────────
  const [initialAmount, setInitialAmount] = useState(10_000_000);
  const [selectedStrategy, setSelectedStrategy] = useState<"DCA" | "LUMP_SUM">("LUMP_SUM");
  const [selectedPeriod, setSelectedPeriod] = useState("1y");
  const [selectedRebalancing, setSelectedRebalancing] = useState("NONE");
  const [dividendReinvested, setDividendReinvested] = useState(true);
  const [weights, setWeights] = useState<Record<string, number>>({});

  // 포트폴리오 로드 완료 후 초기 비중 설정
  const portfolioItems = holdings?.items ?? [];
  const initializedWeights = useMemo(() => {
    if (portfolioItems.length === 0) return {};
    return Object.fromEntries(portfolioItems.map((item) => [item.symbol, item.targetWeight ?? 0]));
  }, [portfolioItems]);

  const activeWeights = Object.keys(weights).length > 0 ? weights : initializedWeights;
  const totalWeight = Math.round(Object.values(activeWeights).reduce((s, v) => s + v, 0) * 10) / 10;
  const canStart = portfolioItems.length > 0 && Math.abs(totalWeight - 100) < 0.5;

  const handleWeightChange = (symbol: string, value: number) => {
    // 5% 단위로 올림/내림 처리 (value가 이미 step=5로 오지만 보장 차원)
    const roundedValue = Math.round(value / 5) * 5;
    setWeights((prev) => ({ ...(Object.keys(prev).length > 0 ? prev : initializedWeights), [symbol]: roundedValue }));
  };

  // 차트 데이터 구성
  const chartData = useMemo(() => {
    return portfolioItems.map((item, idx) => {
      const displayName = item.name || item.symbol;
      return {
        name: displayName,
        value: activeWeights[item.symbol] ?? 0,
        color: COLORS[idx % COLORS.length]
      };
    }).filter(d => d.value > 0);
  }, [portfolioItems, activeWeights]);

  if (!portfolioId) return <Navigate to="/portfolio" replace />;

  if (isLoading) {
    return (
      <div className="page-shell page-content min-h-screen py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    );
  }

  const handleStartBacktest = () => {
    if (!canStart) return;
    
    const params = new URLSearchParams({
      strategy: selectedStrategy,
      amount: initialAmount.toString(),
      benchmarkTicker: "SPY",
      period: selectedPeriod,
      rebalancingPeriod: selectedRebalancing,
      dividendReinvested: dividendReinvested.toString(),
      weights: JSON.stringify(activeWeights)
    });

    navigate(`/backtest/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="포트폴리오 시뮬레이션" description="현재 전략을 과거 데이터에 바로 적용해보는 모바일 웹 설정 화면" showBack />

      <div className="page-shell page-content space-y-6 py-6">
        <section className="rounded-[32px] border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-card)),var(--color-card))] px-5 py-6 shadow-[0_22px_56px_-42px_rgba(15,23,42,0.38)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Backtest setup
          </div>
          <div className="mt-4 text-foreground text-[length:var(--mobile-hero-title-size)] font-bold leading-[1.12] tracking-tight min-[421px]:text-[1.875rem]">
            이 전략이 과거에도
            <br />
            통했는지 바로 확인하세요
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            투자 전략, 금액, 기간, 리밸런싱 주기를 고르고 지금 포트폴리오를 과거 데이터에 적용해봅니다.
          </p>
        </section>

        <section className="rounded-[32px] border border-border bg-card shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
          <div className="border-b border-border px-5 py-5">
            <div className="text-foreground mb-4 font-bold text-xl">투자 전략</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id as "DCA" | "LUMP_SUM")}
                  className={`rounded-3xl border-2 p-5 text-left transition-all ${
                    selectedStrategy === strategy.id ? "border-primary bg-primary/5 shadow-md" : "border-border bg-background"
                  }`}
                >
                  <div className={`mb-1 font-bold ${selectedStrategy === strategy.id ? "text-primary" : "text-foreground"}`}>
                    {strategy.label}
                  </div>
                  <div className="text-xs leading-tight text-muted-foreground">{strategy.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-border px-5 py-5">
            <div className="text-foreground mb-4 font-bold text-xl">
              {selectedStrategy === "DCA" ? "월 투자금액" : "초기 투자금액"}
            </div>
            <div className="rounded-3xl bg-secondary/50 p-8 text-right">
              <input
                type="number"
                min="1"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent text-right text-[length:var(--mobile-number-xl)] font-bold text-foreground outline-none md:text-4xl"
              />
              <div className="mt-2 font-bold text-muted-foreground">원</div>
            </div>
          </div>

          <div className="border-b border-border px-5 py-5">
            <div className="text-foreground mb-4 font-bold text-[18px]">시뮬레이션 기간</div>
            <div className="grid grid-cols-2 gap-3">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`rounded-2xl py-4 text-base font-semibold transition-all ${
                    selectedPeriod === period.id ? "bg-primary text-primary-foreground shadow-lg" : "border border-border bg-background text-foreground"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-border px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-foreground font-bold text-xl">자산 구성 및 비중</div>
              <span className={`text-sm font-bold tabular-nums ${Math.abs(totalWeight - 100) < 0.5 ? "text-primary" : "text-destructive"}`}>
                합계 {totalWeight}%
              </span>
            </div>

            <div className="relative mb-8 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationDuration={500}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-xs font-medium text-muted-foreground">총 비중</div>
                <div className={`text-xl font-bold ${Math.abs(totalWeight - 100) < 0.5 ? "text-foreground" : "text-destructive"}`}>
                  {totalWeight}%
                </div>
              </div>
            </div>

            {portfolioItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">포트폴리오에 종목이 없습니다.</div>
            ) : (
              <div className="space-y-4">
                {portfolioItems.map((item, idx) => {
                  const w = activeWeights[item.symbol] ?? 0;
                  const color = COLORS[idx % COLORS.length];
                  const displayName = item.name || item.symbol;
                  const hasName = !!item.name;

                  return (
                    <div key={item.symbol} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                          <div>
                            <p className="text-sm font-bold text-foreground">{displayName}</p>
                            {hasName && <p className="text-xs font-medium uppercase text-muted-foreground">{item.symbol}</p>}
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm font-bold tabular-nums text-primary">{w}%</span>
                      </div>
                      <Slider value={[w]} onValueChange={([v]) => handleWeightChange(item.symbol, v)} min={0} max={100} step={5} className="w-full" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-b border-border px-5 py-5 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <Label htmlFor="dividend-reinvest" className="text-foreground font-bold text-[18px] cursor-pointer block">
                배당금 재투자
              </Label>
              <p className="text-xs text-muted-foreground mt-1">배당금을 해당 종목에 즉시 재투자합니다.</p>
            </div>
            <Switch 
              id="dividend-reinvest"
              checked={dividendReinvested} 
              onCheckedChange={setDividendReinvested} 
            />
          </div>

          <div className="px-5 py-5">
            <div className="text-foreground mb-4 font-bold text-[18px]">리밸런싱 주기</div>
            <div className="grid grid-cols-2 gap-3">
              {rebalancing.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedRebalancing(option.id)}
                  className={`rounded-2xl py-3 font-semibold transition-all ${
                    selectedRebalancing === option.id ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-[28px] border border-border bg-card px-5 py-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.28)]">
          <button
            onClick={handleStartBacktest}
            disabled={!canStart}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold transition-transform ${
              canStart ? "bg-primary text-primary-foreground shadow-lg active:scale-[0.98]" : "bg-secondary text-muted-foreground"
            }`}
          >
            <FlaskConical className="h-5 w-5" />
            시뮬레이션 시작하기
          </button>
          {!canStart && (
            <p className="mt-3 text-center text-xs text-muted-foreground">비중 합계를 100%에 맞춰야 백테스트를 시작할 수 있습니다.</p>
          )}
        </div>
      </div>

    </div>
  );
}
