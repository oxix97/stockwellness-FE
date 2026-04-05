import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router";
import { ChevronLeft, FlaskConical } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useAuthStore } from "@/store/auth";
import { Skeleton, Slider } from "@/app/components/ui";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

const periods = [
  { id: "1m", label: "최근 1개월" },
  { id: "3m", label: "최근 3개월" },
  { id: "6m", label: "최근 6개월" },
  { id: "1y", label: "최근 1년" },
  { id: "3y", label: "최근 3년" },
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
      <div className="min-h-screen bg-background p-6 space-y-6">
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
      weights: JSON.stringify(activeWeights)
    });

    navigate(`/backtest/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 헤더 */}
      <header className="bg-card px-6 py-4 flex items-center border-b border-border sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center text-foreground font-bold text-lg">
          포트폴리오 시뮬레이션
        </div>
        <div className="w-10" />
      </header>

      {/* 히어로 */}
      <div className="px-6 py-10 bg-card border-b border-border">
        <div className="text-foreground mb-3 font-bold text-3xl leading-tight">
          이대로 과거로<br />돌아간다면? 🔮
        </div>
        <div className="text-muted-foreground font-medium">
          내 포트폴리오가 과거에 어떤 성과를 냈을지 미리 확인해보세요.
        </div>
      </div>

      {/* 투자 전략 */}
      <div className="px-6 py-8 border-b border-border">
        <div className="text-foreground mb-4 font-bold text-xl">투자 전략</div>
        <div className="grid grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id as "DCA" | "LUMP_SUM")}
              className={`p-5 rounded-3xl text-left transition-all border-2 ${
                selectedStrategy === strategy.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              }`}
            >
              <div
                className={`font-bold mb-1 ${
                  selectedStrategy === strategy.id ? "text-primary" : "text-foreground"
                }`}
              >
                {strategy.label}
              </div>
              <div className="text-muted-foreground text-xs leading-tight">
                {strategy.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 초기 투자금액 */}
      <div className="px-6 py-8 border-b border-border">
        <div className="text-foreground mb-4 font-bold text-xl">
          {selectedStrategy === "DCA" ? "월 투자금액" : "초기 투자금액"}
        </div>
        <div className="bg-secondary/50 rounded-3xl p-8 text-right">
          <input
            type="number"
            min="1"
            value={initialAmount}
            onChange={(e) => setInitialAmount(Math.max(1, Number(e.target.value)))}
            className="w-full bg-transparent text-foreground text-right outline-none font-bold text-4xl"
          />
          <div className="text-muted-foreground mt-2 font-bold">원</div>
        </div>
      </div>

      {/* 시뮬레이션 기간 */}
      <div className="px-6 py-6 border-b border-border">
        <div className="text-foreground mb-4 font-bold text-[18px]">시뮬레이션 기간</div>
        <div className="grid grid-cols-2 gap-3">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`py-4 rounded-2xl transition-all font-semibold text-base ${
                selectedPeriod === period.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* 자산 구성 및 비중 — 원형 차트 및 슬라이더 */}
      <div className="px-6 py-8 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="text-foreground font-bold text-xl">자산 구성 및 비중</div>
          <span className={`text-sm font-bold tabular-nums ${Math.abs(totalWeight - 100) < 0.5 ? "text-primary" : "text-destructive"}`}>
            합계 {totalWeight}%
          </span>
        </div>

        {/* 원형(Donut) 차트 시각화 */}
        <div className="h-64 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationDuration={500}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[140px] text-center pointer-events-none">
            <div className="text-muted-foreground text-xs font-medium">총 비중</div>
            <div className={`text-xl font-bold ${Math.abs(totalWeight - 100) < 0.5 ? "text-foreground" : "text-destructive"}`}>
              {totalWeight}%
            </div>
          </div>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-6">
            포트폴리오에 종목이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {portfolioItems.map((item, idx) => {
              const w = activeWeights[item.symbol] ?? 0;
              const color = COLORS[idx % COLORS.length];
              const displayName = item.name || item.symbol;
              const hasName = !!item.name;
              
              return (
                <div key={item.symbol} className="bg-card rounded-2xl px-4 py-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-foreground font-bold text-sm">{displayName}</p>
                        {hasName && <p className="text-muted-foreground text-[10px] uppercase font-medium">{item.symbol}</p>}
                      </div>
                    </div>
                    <span className="text-primary font-bold text-sm tabular-nums w-12 text-right">{w}%</span>
                  </div>
                  <Slider
                    value={[w]}
                    onValueChange={([v]) => handleWeightChange(item.symbol, v)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 리밸런싱 주기 */}
      <div className="px-6 py-6 border-b border-border">
        <div className="text-foreground mb-4 font-bold text-[18px]">리밸런싱 주기</div>
        <div className="grid grid-cols-2 gap-3">
          {rebalancing.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedRebalancing(option.id)}
              className={`py-3 rounded-2xl transition-all font-semibold ${
                selectedRebalancing === option.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border">
        <button
          onClick={handleStartBacktest}
          disabled={!canStart}
          className={`w-full rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg ${
            canStart
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-lg font-bold">시뮬레이션 시작하기</span>
        </button>
      </div>
    </div>
  );
}
