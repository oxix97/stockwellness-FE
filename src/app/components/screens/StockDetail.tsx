import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Heart } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Customized } from "recharts";
import { useStock } from "@/hooks/use-stock";
import { usePortfolio, useUpdatePortfolio } from "@/hooks/use-portfolio";
import { useAuthStore } from "@/store/auth";
import { Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";

const PERIODS = ["일봉", "주봉", "월봉"];
const PERIOD_CONFIG: Record<string, { period: string; frequency: string }> = {
  "일봉": { period: "3M",  frequency: "DAILY"   },
  "주봉": { period: "6M",  frequency: "WEEKLY"  },
  "월봉": { period: "ALL", frequency: "MONTHLY" },
};

export function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const portfolioId = useAuthStore((s) => s.portfolioId);
  const [periodLabel, setPeriodLabel] = useState("일봉");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const { useHistory, useReturns } = useStock();
  const { holdings } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();

  const ticker = symbol || "";
  const { period: apiPeriod, frequency: apiFrequency } = PERIOD_CONFIG[periodLabel] || PERIOD_CONFIG["일봉"];

  const history = useHistory(ticker, apiPeriod, apiFrequency);
  // 어제 대비 오늘 계산용 — 항상 최근 일봉 2개 필요
  const dailyHistory = useHistory(ticker, "1M", "DAILY");

  // 수익률 비교: 기간 고정 호출
  const returns1W  = useReturns(ticker, "1W");
  const returns1M  = useReturns(ticker, "1M");
  const returns3M  = useReturns(ticker, "3M");
  const returns1Y  = useReturns(ticker, "1Y");

  const stockName = history.data?.stockName;
  const benchmarkName = history.data?.benchmarkName;

  const dailyRate = useMemo(() => {
    const prices = dailyHistory.data?.prices || [];
    if (prices.length < 2) return null;
    const prev = prices[prices.length - 2].close;
    const today = prices[prices.length - 1].close;
    if (!prev) return null;
    return ((today - prev) / prev) * 100;
  }, [dailyHistory.data]);

  const { candleData, latestPrice } = useMemo(() => {
    const prices = history.data?.prices || [];
    const benchmarks = history.data?.benchmarks || [];
    if (prices.length === 0) return { candleData: [], latestPrice: 0 };

    const first = prices[0].close;
    const latest = prices[prices.length - 1].close;

    // 전체 가격 범위 (최소 몸통 높이 계산용)
    const allPrices = prices.flatMap((p) => [p.high, p.low]);
    const priceRange = Math.max(...allPrices) - Math.min(...allPrices);
    const minBodyHeight = priceRange * 0.003;

    // 벤치마크: {date, returnRate}를 날짜 기준 Map으로 만들어 빠르게 조회
    const benchmarkMap = new Map(benchmarks.map((b) => [b.date, b.returnRate]));

    return {
      candleData: prices.map((p) => {
        const returnRate = benchmarkMap.get(p.date);
        return {
          date: p.date,
          open: p.open,
          close: p.close,
          high: p.high,
          low: p.low,
          // 스택드 바 방식: bodyLow(투명 베이스) + bodyHeight(색상 몸통)
          bodyLow: Math.min(p.open, p.close),
          bodyHeight: Math.max(Math.abs(p.close - p.open), minBodyHeight),
          isUp: p.close >= p.open,
          volume: p.volume,
          ma5: p.ma5 ?? null,
          ma20: p.ma20 ?? null,
          ma60: p.ma60 ?? null,
          // 벤치마크 수익률을 종목 시작가 기준으로 정규화
          benchmark: returnRate != null ? first * (1 + returnRate / 100) : null,
        };
      }),
      latestPrice: latest,
    };
  }, [history.data]);

  const handleAddClick = () => {
    if (!portfolioId) {
      toast.info("포트폴리오를 먼저 만들어보세요.");
      navigate("/portfolio");
      return;
    }
    const alreadyIn = holdings?.items.some((item) => item.symbol === ticker);
    if (alreadyIn) {
      toast.info("이미 포트폴리오에 있는 종목입니다.");
      return;
    }
    setPurchasePrice(String(latestPrice || ""));
    setShowAddDialog(true);
  };

  const handleConfirmAdd = () => {
    if (!holdings || !portfolioId) return;
    const qty = Number(quantity);
    const price = Number(purchasePrice);
    if (!qty || !price) {
      toast.error("수량과 매입단가를 올바르게 입력해주세요.");
      return;
    }
    const existingItems = holdings.items.map((item) => ({
      symbol: item.symbol,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      currency: item.currency,
      assetType: item.assetType as "STOCK" | "CASH",
      targetWeight: item.targetWeight,
    }));
    updatePortfolio.mutate(
      {
        name: holdings.name,
        description: holdings.description ?? "",
        items: [...existingItems, { symbol: ticker, quantity: qty, purchasePrice: price, currency: "KRW", assetType: "STOCK", targetWeight: 0 }],
      },
      {
        onSuccess: () => {
          toast.success(`${ticker}을(를) 포트폴리오에 추가했습니다.`);
          setShowAddDialog(false);
        },
        onError: () => toast.error("포트폴리오 추가에 실패했습니다."),
      }
    );
  };

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
    <div className="min-h-screen bg-background">
      <header className="bg-card px-6 py-4 flex items-center justify-between border-b border-border">
        <PageHeader showBack />
        <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 -mr-2">
          <Heart className={`w-6 h-6 ${isFavorite ? "fill-[#FF4756] text-[#FF4756]" : "text-muted-foreground"}`} />
        </button>
      </header>

      <PriceSection
        ticker={ticker}
        stockName={stockName}
        latestPrice={latestPrice}
        dailyRate={dailyRate}
      />

      <div className="bg-card px-6 py-4 flex gap-2 border-b border-border">
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

      <ChartSection data={candleData} periodLabel={periodLabel} benchmarkName={benchmarkName} />

      <ComparisonSection
        returnsData={[
          { label: "1주",  data: returns1W.data,  isLoading: returns1W.isLoading  },
          { label: "1달",  data: returns1M.data,  isLoading: returns1M.isLoading  },
          { label: "3달",  data: returns3M.data,  isLoading: returns3M.isLoading  },
          { label: "1년",  data: returns1Y.data,  isLoading: returns1Y.isLoading  },
        ]}
      />

      <div className="px-6 pb-12 pt-2">
        <button
          onClick={handleAddClick}
          disabled={updatePortfolio.isPending}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-xl font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {updatePortfolio.isPending ? "추가 중..." : "내 포트폴리오에 담기"}
        </button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ticker} 포트폴리오에 담기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">수량 (주)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="w-full h-11 bg-secondary rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">매입단가 (₩)</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                min="0"
                className="w-full h-11 bg-secondary rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleConfirmAdd}
              disabled={updatePortfolio.isPending}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold disabled:opacity-50"
            >
              추가하기
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriceSection({ ticker, stockName, latestPrice, dailyRate }: any) {
  const isUp = dailyRate != null && dailyRate >= 0;
  return (
    <div className="bg-card px-6 py-10 border-b border-border">
      <div className="text-muted-foreground mb-1 font-medium text-sm">{ticker}</div>
      {stockName && <div className="text-foreground mb-2 font-bold text-lg">{stockName}</div>}
      <div className="text-foreground mb-2 font-bold text-5xl">
        ₩{formatCurrency(latestPrice)}
      </div>
      {dailyRate != null && (
        <div className={`font-bold text-lg ${isUp ? "text-up" : "text-down"}`}>
          어제보다 {isUp ? "+" : ""}{dailyRate.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

/** 캔들 wick(꼬리) 렌더링 — Customized로 high~low 선을 직접 그림 */
function CandleWicks({ data, xAxisMap, yAxisMap }: any) {
  const xAxis = xAxisMap && (Object.values(xAxisMap)[0] as any);
  const yAxis = yAxisMap && (Object.values(yAxisMap)[0] as any);
  const xScale = xAxis?.scale;
  const yScale = yAxis?.scale;
  if (!xScale || !yScale) return null;

  const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 10;
  const offset = bandwidth / 2;

  return (
    <g>
      {(data as any[]).map((d: any, i: number) => {
        const x = xScale(d.date);
        if (x == null) return null;
        const cx = x + offset;
        const yHigh = yScale(d.high);
        const yLow = yScale(d.low);
        const yBodyTop = yScale(Math.max(d.open, d.close));
        const yBodyBottom = yScale(Math.min(d.open, d.close));
        const color = d.isUp ? "#FF4756" : "#3182F6";
        return (
          <g key={i}>
            {/* 위 꼬리 */}
            <line x1={cx} y1={yHigh} x2={cx} y2={yBodyTop} stroke={color} strokeWidth={1} />
            {/* 아래 꼬리 */}
            <line x1={cx} y1={yBodyBottom} x2={cx} y2={yLow} stroke={color} strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
}

function ChartSection({ data, periodLabel, benchmarkName }: any) {
  const labelMap: Record<string, string> = { "일봉": "일봉", "주봉": "주봉", "월봉": "월봉" };
  const maxVolume = Math.max(...data.map((d: any) => d.volume || 0), 1);
  const interval = Math.floor(data.length / 4);

  return (
    <div className="bg-card px-6 py-10">
      <div className="mb-4">
        <span className="text-muted-foreground text-sm font-bold">{labelMap[periodLabel]}</span>
      </div>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-[10px] font-bold">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: "#F59E0B" }} />
          <span className="text-muted-foreground">MA5</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: "#8B5CF6" }} />
          <span className="text-muted-foreground">MA20</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: "#3B82F6" }} />
          <span className="text-muted-foreground">MA60</span>
        </span>
        <span className="flex items-center gap-1">
          <svg width="16" height="4" viewBox="0 0 16 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
          <span className="text-muted-foreground">{benchmarkName || "벤치마크"}</span>
        </span>
      </div>

      {/* 캔들 + 라인 차트 */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fontWeight: 500 }}
              stroke="#9CA3AF"
              interval={interval}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip content={<CandleTooltip />} cursor={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "4 4" }} />

            {/* 투명 베이스: bodyLow 위치까지 올려줌 */}
            <Bar dataKey="bodyLow" stackId="candle" fill="transparent" stroke="none" isAnimationActive={false} maxBarSize={10} />
            {/* 캔들 몸통: bodyLow에서 bodyHeight만큼 */}
            <Bar dataKey="bodyHeight" stackId="candle" isAnimationActive={false} maxBarSize={10} radius={[1, 1, 1, 1]}>
              {data.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.isUp ? "#FF4756" : "#3182F6"} />
              ))}
            </Bar>

            {/* wick(꼬리) */}
            <Customized component={(props: any) => <CandleWicks {...props} data={data} />} />

            {/* MA 라인들 */}
            <Line type="monotone" dataKey="ma5"  stroke="#F59E0B" strokeWidth={1} dot={false} animationDuration={0} connectNulls />
            <Line type="monotone" dataKey="ma20" stroke="#8B5CF6" strokeWidth={1} dot={false} animationDuration={0} connectNulls />
            <Line type="monotone" dataKey="ma60" stroke="#3B82F6" strokeWidth={1} dot={false} animationDuration={0} connectNulls />

            {/* 벤치마크 라인 — 회색 점선 */}
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#9CA3AF"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              animationDuration={600}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 거래량 패널 */}
      <div className="h-16 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, maxVolume * 1.2]} />
            <Tooltip content={<CandleTooltip />} cursor={{ stroke: "#9CA3AF", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Bar dataKey="volume" isAnimationActive={false} maxBarSize={10} radius={[1, 1, 0, 0]}>
              {data.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.isUp ? "#FF475640" : "#3182F640"} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[9px] text-muted-foreground mt-0.5 font-medium">거래량</div>
    </div>
  );
}

function CandleTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl min-w-[160px]">
      <div className="text-muted-foreground text-[10px] font-bold uppercase mb-2">{d.date}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold">
        <span className="text-muted-foreground">시가</span>
        <span className="text-foreground text-right">₩{d.open?.toLocaleString()}</span>
        <span className="text-muted-foreground">고가</span>
        <span className="text-[#FF4756] text-right">₩{d.high?.toLocaleString()}</span>
        <span className="text-muted-foreground">저가</span>
        <span className="text-[#3182F6] text-right">₩{d.low?.toLocaleString()}</span>
        <span className="text-muted-foreground">종가</span>
        <span className={`${d.isUp ? "text-[#FF4756]" : "text-[#3182F6]"} text-right`}>₩{d.close?.toLocaleString()}</span>
      </div>
      {d.volume != null && (
        <div className="mt-2 pt-2 border-t border-border grid grid-cols-2 gap-x-4 text-xs font-bold">
          <span className="text-muted-foreground">거래량</span>
          <span className="text-foreground text-right">{d.volume?.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function ComparisonSection({ returnsData }: any) {
  return (
    <div className="px-6 py-10">
      <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
        <div className="text-foreground mb-6 font-bold text-2xl">수익률 비교</div>
        {/* 헤더 */}
        <div className="grid grid-cols-3 text-xs font-bold text-muted-foreground mb-3">
          <span>기간</span>
          <span className="text-center">종목</span>
          <span className="text-right">벤치마크</span>
        </div>
        <div className="space-y-3">
          {returnsData.map(({ label, data, isLoading }: any) => {
            const stockRate = data?.stockReturnRate;
            const benchRate = data?.benchmarkReturnRate;
            const isUp = stockRate != null && stockRate >= 0;
            return (
              <div key={label} className="grid grid-cols-3 items-center py-3 border-t border-border">
                <span className="text-muted-foreground font-medium text-sm">{label}</span>
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-12 mx-auto rounded" />
                    <Skeleton className="h-4 w-12 ml-auto rounded" />
                  </>
                ) : (
                  <>
                    <span className={`text-center font-bold text-sm ${isUp ? "text-up" : "text-down"}`}>
                      {stockRate != null ? `${stockRate > 0 ? "+" : ""}${stockRate}%` : "-"}
                    </span>
                    <span className="text-right font-bold text-sm text-foreground">
                      {benchRate != null ? `${benchRate > 0 ? "+" : ""}${benchRate}%` : "-"}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
