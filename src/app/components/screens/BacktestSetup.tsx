import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, X, FlaskConical } from "lucide-react";
import { Root as SliderRoot, Track as SliderTrack, Range as SliderRange, Thumb as SliderThumb } from "@radix-ui/react-slider";

interface PortfolioItem {
  symbol: string;
  name: string;
  weight: number;
}

const presetStocks = [
  { symbol: "005930", name: "삼성전자" },
  { symbol: "000660", name: "SK하이닉스" },
  { symbol: "035420", name: "NAVER" },
  { symbol: "TSLA", name: "TESLA" },
  { symbol: "KODEX200", name: "KODEX 200" },
];

const periods = [
  { id: "1y", label: "최근 1년" },
  { id: "3y", label: "최근 3년" },
  { id: "5y", label: "최근 5년" },
  { id: "max", label: "최대 기간" },
];

const strategies = [
  { id: "DCA", label: "적립식 (DCA)", description: "매달 일정 금액을 추가 투자" },
  { id: "LUMP_SUM", label: "거치식 (Lump Sum)", description: "한 번에 전액 투자" },
];

const rebalancing = [
  { id: "none", label: "안 함" },
  { id: "monthly", label: "매월" },
  { id: "quarterly", label: "매 분기" },
  { id: "yearly", label: "매년" },
];

const benchmarks = [
  { id: "KOSPI", label: "코스피" },
  { id: "KOSPI200", label: "코스피 200" },
  { id: "KOSDAQ", label: "코스닥" },
];

export function BacktestSetup() {
  const navigate = useNavigate();
  const [initialAmount, setInitialAmount] = useState(10000000);
  const [selectedStrategy, setSelectedStrategy] = useState<"DCA" | "LUMP_SUM">("LUMP_SUM");
  const [selectedPeriod, setSelectedPeriod] = useState("1y");
  const [selectedRebalancing, setSelectedRebalancing] = useState("none");
  const [selectedBenchmark, setSelectedBenchmark] = useState("KOSPI");
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { symbol: "005930", name: "삼성전자", weight: 40 },
    { symbol: "000660", name: "SK하이닉스", weight: 30 },
    { symbol: "KODEX200", name: "KODEX 200", weight: 30 },
  ]);
  const [showAddStock, setShowAddStock] = useState(false);

  const totalWeight = portfolio.reduce((sum, item) => sum + item.weight, 0);
  const isValid = totalWeight === 100;

  const updateWeight = (index: number, newWeight: number) => {
    const updated = [...portfolio];
    updated[index].weight = newWeight;
    setPortfolio(updated);
  };

  const removeStock = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const addStock = (stock: typeof presetStocks[0]) => {
    if (!portfolio.find((p) => p.symbol === stock.symbol)) {
      setPortfolio([...portfolio, { ...stock, weight: 0 }]);
    }
    setShowAddStock(false);
  };

  const handleStartBacktest = () => {
    if (isValid) {
      navigate("/backtest/result", {
        state: {
          strategy: selectedStrategy,
          amount: initialAmount,
          benchmarkTicker: selectedBenchmark,
          // 추가 로컬 정보
          period: selectedPeriod,
          portfolio,
        },
      });
    }
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
        <div className="w-10"></div>
      </header>

      {/* 히어로 메시지 */}
      <div className="px-6 py-10 bg-card border-b border-border">
        <div className="text-foreground mb-3 font-bold text-3xl leading-tight">
          이대로 과거로<br />돌아간다면? 🔮
        </div>
        <div className="text-muted-foreground font-medium">
          내 포트폴리오가 과거에 어떤 성과를 냈을지 미리 확인해보세요.
        </div>
      </div>

      {/* 전략 선택 */}
      <div className="px-6 py-8 border-b border-border">
        <div className="text-foreground mb-4 font-bold text-xl">투자 전략</div>
        <div className="grid grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id as any)}
              className={`p-5 rounded-3xl text-left transition-all border-2 ${
                selectedStrategy === strategy.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              }`}
            >
              <div className={`font-bold mb-1 ${selectedStrategy === strategy.id ? "text-primary" : "text-foreground"}`}>
                {strategy.label}
              </div>
              <div className="text-muted-foreground text-xs leading-tight">
                {strategy.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 초기 투자 금액 */}
      <div className="px-6 py-8 border-b border-border">
        <div className="text-foreground mb-4 font-bold text-xl">초기 투자금액</div>
        <div className="bg-secondary/50 rounded-3xl p-8 text-right">
          <input
            type="number"
            value={initialAmount}
            onChange={(e) => setInitialAmount(Number(e.target.value))}
            className="w-full bg-transparent text-foreground text-right outline-none font-bold text-4xl"
          />
          <div className="text-muted-foreground mt-2 font-bold">원</div>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="px-6 py-6 border-b border-border">
        <div className="text-foreground mb-4" style={{ fontSize: '18px', fontWeight: 700 }}>
          시뮬레이션 기간
        </div>
        <div className="grid grid-cols-2 gap-3">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`py-4 rounded-2xl transition-all ${
                selectedPeriod === period.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-foreground border border-border"
              }`}
              style={{ fontSize: '16px', fontWeight: 600 }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* 포트폴리오 설정 */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="text-foreground" style={{ fontSize: '18px', fontWeight: 700 }}>
            자산 구성 및 비중
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isValid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            }`}
          >
            합계: {totalWeight}%
          </div>
        </div>

        <div className="space-y-4 mb-4">
          {portfolio.map((item, index) => (
            <div key={item.symbol} className="bg-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-foreground mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                    {item.name}
                  </div>
                  <div className="text-muted-foreground text-sm">{item.symbol}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-primary" style={{ fontSize: '24px', fontWeight: 700 }}>
                    {item.weight}%
                  </div>
                  <button
                    onClick={() => removeStock(index)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <SliderRoot
                value={[item.weight]}
                onValueChange={([value]) => updateWeight(index, value)}
                max={100}
                step={5}
                className="relative flex items-center w-full h-5"
              >
                <SliderTrack className="relative h-2 grow rounded-full bg-secondary">
                  <SliderRange className="absolute h-full rounded-full bg-primary" />
                </SliderTrack>
                <SliderThumb className="block w-6 h-6 bg-primary rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </SliderRoot>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAddStock(true)}
          className="w-full py-4 bg-secondary text-foreground rounded-2xl flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span style={{ fontSize: '16px', fontWeight: 600 }}>종목 추가</span>
        </button>
      </div>

      {/* 리밸런싱 */}
      <div className="px-6 py-6 border-b border-border">
        <div className="text-foreground mb-4" style={{ fontSize: '18px', fontWeight: 700 }}>
          리밸런싱 주기
        </div>
        <div className="grid grid-cols-2 gap-3">
          {rebalancing.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedRebalancing(option.id)}
              className={`py-3 rounded-2xl transition-all ${
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

      {/* 벤치마크 */}
      <div className="px-6 py-6">
        <div className="text-foreground mb-4" style={{ fontSize: '18px', fontWeight: 700 }}>
          벤치마크 (비교 대상)
        </div>
        <div className="flex gap-3">
          {benchmarks.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedBenchmark(option.id)}
              className={`flex-1 py-3 rounded-2xl transition-all ${
                selectedBenchmark === option.id
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
          disabled={!isValid}
          className={`w-full rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg ${
            isValid
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-lg font-bold">시뮬레이션 시작하기</span>
        </button>
      </div>

      {/* 종목 추가 모달 */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-card w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="text-foreground" style={{ fontSize: '20px', fontWeight: 700 }}>
                종목 추가
              </div>
              <button onClick={() => setShowAddStock(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              {presetStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => addStock(stock)}
                  disabled={portfolio.some((p) => p.symbol === stock.symbol)}
                  className={`w-full p-4 rounded-2xl text-left ${
                    portfolio.some((p) => p.symbol === stock.symbol)
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-secondary text-foreground hover:bg-primary/10"
                  }`}
                >
                  <div className="text-foreground" style={{ fontSize: '16px', fontWeight: 600 }}>
                    {stock.name}
                  </div>
                  <div className="text-muted-foreground text-sm">{stock.symbol}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
