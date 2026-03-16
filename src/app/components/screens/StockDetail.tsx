import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { Heart, CandlestickChart } from "lucide-react";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";
import { useStock } from "@/hooks/use-stock";
import { Skeleton } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";
import { THEME } from "@/styles/theme";
import { formatCurrency } from "@/utils/format";

const PERIODS = ["1일", "1주", "1달", "1년", "3년"];
const PERIOD_MAP: Record<string, string> = {
  "1일": "1W", "1주": "1W", "1달": "1M", "1년": "1Y", "3년": "ALL",
};

export function StockDetail() {
  const { symbol } = useParams();
  const [periodLabel, setPeriodLabel] = useState("1년");
  const [isFavorite, setIsFavorite] = useState(false);
  const { useHistory, useReturns } = useStock();

  const ticker = symbol || "";
  const apiPeriod = PERIOD_MAP[periodLabel] || "1Y";

  const history = useHistory(ticker, apiPeriod);
  const returns = useReturns(ticker, apiPeriod);

  const { chartData, latestPrice, change, changePercent, isUp } = useMemo(() => {
    const prices = history.data?.prices || [];
    if (prices.length === 0) return { chartData: [], latestPrice: 0, change: 0, changePercent: "0", isUp: true };

    const first = prices[0].close;
    const latest = prices[prices.length - 1].close;
    const diff = latest - first;
    
    return {
      chartData: prices.map(p => ({ time: p.date, price: p.close })),
      latestPrice: latest,
      change: diff,
      changePercent: ((diff / first) * 100).toFixed(2),
      isUp: diff >= 0
    };
  }, [history.data]);

  if (history.isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-card px-6 py-4 flex items-center justify-between border-b border-border">
        <PageHeader showBack />
        <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 -mr-2">
          <Heart className={`w-6 h-6 ${isFavorite ? "fill-[#FF4756] text-[#FF4756]" : "text-muted-foreground"}`} />
        </button>
      </header>

      <PriceSection 
        ticker={ticker} 
        latestPrice={latestPrice} 
        change={change} 
        changePercent={changePercent} 
        isUp={isUp} 
        periodLabel={periodLabel} 
      />

      <div className="bg-card px-6 py-4 flex gap-2 overflow-x-auto border-b border-border scrollbar-hide">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodLabel(p)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-bold ${
              periodLabel === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground opacity-60"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <ChartSection data={chartData} isUp={isUp} />

      <ComparisonSection returns={returns.data} periodLabel={periodLabel} isLoading={returns.isLoading} isUp={isUp} />

      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-background/80 backdrop-blur-md">
        <button className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-xl font-bold shadow-2xl active:scale-95 transition-transform">
          내 포트폴리오에 담기
        </button>
      </div>
    </div>
  );
}

function PriceSection({ ticker, latestPrice, change, changePercent, isUp, periodLabel }: any) {
  return (
    <div className="bg-card px-6 py-10 border-b border-border">
      <div className="text-muted-foreground mb-2 font-bold text-lg">{ticker}</div>
      <div className="text-foreground mb-4 font-bold text-5xl">
        ₩{formatCurrency(latestPrice)}
      </div>
      <div className="flex items-center gap-3">
        <span className={`${isUp ? "text-up" : "text-down"} font-bold text-xl`}>
          {periodLabel} 전보다 {isUp ? "+" : ""}₩{formatCurrency(Math.abs(change))}
        </span>
        <span className={`${isUp ? "text-up" : "text-down"} font-bold text-xl`}>
          ({isUp ? "+" : ""}{changePercent}% {isUp ? "🔺" : "🔻"})
        </span>
      </div>
    </div>
  );
}

function ChartSection({ data, isUp }: { data: any[]; isUp: boolean }) {
  return (
    <div className="bg-card px-6 py-10">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip
              content={<CustomTooltip isUp={isUp} />}
              cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isUp ? THEME.COLOR.UP : THEME.COLOR.DOWN}
              strokeWidth={4}
              dot={false}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-end mt-6">
        <button className="flex items-center gap-2 text-muted-foreground font-semibold hover:text-primary transition-colors">
          <CandlestickChart className="w-5 h-5" />
          <span>캔들로 보기</span>
        </button>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, isUp }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl">
        <div className="text-muted-foreground text-[10px] font-bold uppercase mb-1">
          {new Date(payload[0].payload.time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`text-xl font-bold ${isUp ? "text-[#FF4756]" : "text-[#3182F6]"}`}>
          ₩{payload[0].value.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
}

function ComparisonSection({ returns, periodLabel, isLoading, isUp }: any) {
  return (
    <div className="px-6 py-10">
      <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
        <div className="text-foreground mb-8 font-bold text-2xl">수익률 비교</div>
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">종목 수익률 ({periodLabel})</span>
              <span className={`${isUp ? "text-up" : "text-down"} font-bold text-xl`}>
                 {returns?.stockReturnRate}%
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-6">
              <span className="text-muted-foreground font-medium">벤치마크 ({returns?.period})</span>
              <span className="text-foreground font-bold text-xl">
                 {returns?.benchmarkReturnRate}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
