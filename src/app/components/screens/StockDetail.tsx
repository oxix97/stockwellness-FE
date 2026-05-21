import { useState, useMemo } from "react";
// Vite Hot Reload Trigger
import { useParams, useNavigate } from "react-router";
import { Heart, Plus, Sparkles } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Customized } from "recharts";
import { useStock } from "@/hooks/use-stock";
import { usePortfolio, useUpdatePortfolio } from "@/hooks/use-portfolio";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuthStore } from "@/store/auth";
import { Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui";
import { PageHeader, AdUnit } from "@/app/components/shared";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { formatCurrency } from "@/utils/format";
import { StockReturnsResponse } from "@/api/stock";
import { ChartPeriod, ChartFrequency } from "@/types/api";
import { toast } from "sonner";

// ── 차트 색상 상수 (한국 관례: 상승=빨강, 하락=파랑) ────────────────────
const CHART_COLORS = {
  up: "#FF4756",
  down: "#3182F6",
  upAlpha: "#FF475640",
  downAlpha: "#3182F640",
  ma5: "#F59E0B",
  ma20: "#8B5CF6",
  ma60: "#3B82F6",
  benchmark: "#9CA3AF",
  cursor: "#9CA3AF",
} as const;

// ── 로컬 타입 정의 ────────────────────────────────────────────────────────
interface CandleEntry {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  bodyLow: number;
  bodyHeight: number;
  isUp: boolean;
  volume: number;
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  benchmark: number | null;
}

interface PriceSectionProps {
  ticker: string;
  stockName: string | undefined;
  latestPrice: number;
  dailyRate: number | null;
}

type RechartsScaleFn = ((value: string | number) => number | undefined) & {
  bandwidth?: () => number;
};

interface CandleWicksProps {
  data: CandleEntry[];
  xAxisMap?: Record<string, { scale?: RechartsScaleFn }>;
  yAxisMap?: Record<string, { scale?: RechartsScaleFn }>;
}

interface ChartSectionProps {
  data: CandleEntry[];
  periodLabel: string;
  benchmarkName: string | undefined;
}

interface CandleTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CandleEntry }>;
}

interface ReturnEntry {
  label: string;
  data: StockReturnsResponse | undefined;
  isLoading: boolean;
}

interface ComparisonSectionProps {
  returnsData: ReturnEntry[];
}

interface RsiCardProps {
  rsi: number | null;
  isLoading: boolean;
}

// ── RSI 계산 (14일 기준) ───────────────────────────────────────────────────
function computeRsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  let avgGain = changes.slice(0, period).reduce((s, v) => s + Math.max(v, 0), 0) / period;
  let avgLoss = changes.slice(0, period).reduce((s, v) => s + Math.max(-v, 0), 0) / period;
  for (const change of changes.slice(period)) {
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

// ── 기간 설정 ─────────────────────────────────────────────────────────────
const PERIODS = ["일봉", "주봉", "월봉"];
const PERIOD_CONFIG: Record<string, { period: ChartPeriod; frequency: ChartFrequency }> = {
  "일봉": { period: "3M",  frequency: "DAILY"   },
  "주봉": { period: "1Y",  frequency: "WEEKLY"  },
  "월봉": { period: "5Y",  frequency: "MONTHLY" },
};

export function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const portfolioId = useAuthStore((s) => s.portfolioId);
  const [periodLabel, setPeriodLabel] = useState("일봉");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const { useHistory, useReturns } = useStock();
  const { holdings } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const { groups, addItem, removeItem, createGroup, useIsTickerInWatchlist } = useWatchlist();

  const ticker = symbol || "";

  // 현재 종목의 관심 등록 상태 실시간 확인
  const { isInWatchlist, containedGroups, isLoading: isWatchlistLoading } = useIsTickerInWatchlist(ticker);

  const handleFavoriteToggle = async () => {
    if (!useAuthStore.getState().accessToken) {
      toast.info("로그인 후 관심 종목을 추가해보세요.");
      navigate("/login");
      return;
    }

    if (isWatchlistLoading) return;

    if (isInWatchlist) {
      // 삭제 (해당 종목이 포함된 모든 그룹에서 제거)
      containedGroups.forEach(group => {
        removeItem.mutate({ groupId: group.id, ticker }, {
          onSuccess: () => toast.success("관심 종목에서 제거되었습니다."),
          onError: () => toast.error("관심 종목 제거에 실패했습니다.")
        });
      });
    } else {
      // 추가
      let targetGroupId = groups.data?.[0]?.id;
      
      // 그룹이 하나도 없다면 생성 후 추가
      if (!targetGroupId) {
        try {
          targetGroupId = await createGroup.mutateAsync("기본");
        } catch (error) {
          toast.error("관심 그룹 생성에 실패했습니다.");
          return;
        }
      }

      addItem.mutate({ groupId: targetGroupId!, body: { ticker } }, {
        onSuccess: () => toast.success("관심 종목에 추가되었습니다."),
        onError: () => toast.error("이미 추가되었거나 추가에 실패했습니다.")
      });
    }
  };
  const { period: apiPeriod, frequency: apiFrequency } = PERIOD_CONFIG[periodLabel] || PERIOD_CONFIG["일봉"];

  const history = useHistory(ticker, apiPeriod, apiFrequency);
  // 어제 대비 오늘 계산용 — 항상 최근 일봉 2개 필요
  const dailyHistory = useHistory(ticker, "1M", "DAILY");

  // 수익률 비교: 기간 고정 호출
  const returns1W = useReturns(ticker, "1W");
  const returns1M = useReturns(ticker, "1M");
  const returns3M = useReturns(ticker, "3M");
  const returns1Y = useReturns(ticker, "1Y");

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

  const rsi = useMemo(() => {
    const closes = (dailyHistory.data?.prices || []).map((p) => p.close);
    return computeRsi(closes);
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

    // 날짜가 정확히 일치하지 않는 경우(예: 주봉)를 위해 정렬된 벤치마크 날짜 리스트 준비
    const sortedBenchmarkDates = benchmarks.map(b => b.date).sort();

    return {
      candleData: prices.map((p) => {
        let returnRate = benchmarkMap.get(p.date);
        
        // 날짜가 정확히 일치하지 않으면 해당 날짜 이전의 가장 가까운 벤치마크 데이터를 찾음
        if (returnRate === undefined && sortedBenchmarkDates.length > 0) {
          const closestDate = findClosestDate(sortedBenchmarkDates, p.date);
          if (closestDate) {
            returnRate = benchmarkMap.get(closestDate);
          }
        }

        return {
          date: p.date,
          open: p.open,
          close: p.close,
          high: p.high,
          low: p.low,
          bodyLow: Math.min(p.open, p.close),
          bodyHeight: Math.max(Math.abs(p.close - p.open), minBodyHeight),
          isUp: p.close >= p.open,
          volume: p.volume,
          ma5: p.ma5 ?? null,
          ma20: p.ma20 ?? null,
          ma60: p.ma60 ?? null,
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
      <PageHeader
        showBack
        title="종목 상세"
        description={stockName ? `${stockName} · ${ticker}` : `${ticker} 상세 흐름과 핵심 시그널`}
        rightContent={
          <button
            onClick={handleFavoriteToggle}
            className="rounded-full p-2 transition-colors hover:bg-secondary"
            aria-label="관심 종목"
            disabled={isWatchlistLoading}
          >
            <Heart
              className={`h-6 w-6 transition-colors ${isInWatchlist ? "fill-red-500 stroke-red-500" : "text-muted-foreground"}`}
            />
          </button>
        }
      />

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

      <AdUnit type="detail-in-article" className="px-6 my-4" />

      <RsiCard rsi={rsi} isLoading={dailyHistory.isLoading} />

      <ComparisonSection
        returnsData={[
          { label: "1주", data: returns1W.data, isLoading: returns1W.isLoading },
          { label: "1달", data: returns1M.data, isLoading: returns1M.isLoading },
          { label: "3달", data: returns3M.data, isLoading: returns3M.isLoading },
          { label: "1년", data: returns1Y.data, isLoading: returns1Y.isLoading },
        ]}
      />

      <div className="px-6 pb-12 pt-2">
        <button
          onClick={handleAddClick}
          disabled={updatePortfolio.isPending}
          className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform active:scale-95 disabled:opacity-50 min-[408px]:py-5"
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

function findClosestDate(dates: string[], targetDate: string) {
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    if (dates[i] <= targetDate) return dates[i];
  }
  return undefined;
}

function PriceSection({ ticker, stockName, latestPrice, dailyRate }: PriceSectionProps) {
  return (
    <section className="page-shell page-content py-6">
      <div className="overflow-hidden rounded-[32px] border border-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_10%,var(--color-card)),var(--color-card))] px-5 py-6 shadow-[0_22px_56px_-42px_rgba(15,23,42,0.38)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Stock overview
        </div>
        <div className="mt-4 mb-1 text-sm font-medium text-muted-foreground">{ticker}</div>
        {stockName && <div className="mb-2 text-lg font-bold text-foreground">{stockName}</div>}
        <div className="mb-2 text-[length:var(--mobile-number-xl)] font-bold text-foreground md:text-5xl">₩{formatCurrency(latestPrice)}</div>
        {dailyRate != null && (
          <div className="text-lg font-bold">
            어제보다 <SignedValueLabel value={dailyRate} format="percent" ariaLabelPrefix={`${stockName || ticker} 일간 등락률`} />
          </div>
        )}
        <div className="mt-5 rounded-[24px] border border-border/70 bg-card/80 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">바로 할 수 있는 행동</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">가격과 흐름을 확인한 뒤 포트폴리오 담기 또는 관심종목 저장으로 이어집니다.</p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Plus className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 캔들 wick(꼬리) 렌더링 — Customized로 high~low 선을 직접 그림 */
function CandleWicks({ data, xAxisMap, yAxisMap }: CandleWicksProps) {
  const xAxis = xAxisMap && (Object.values(xAxisMap)[0]);
  const yAxis = yAxisMap && (Object.values(yAxisMap)[0]);
  const xScale = xAxis?.scale;
  const yScale = yAxis?.scale;
  if (!xScale || !yScale) return null;

  const bandwidth = xScale.bandwidth ? xScale.bandwidth() : 10;
  const offset = bandwidth / 2;

  return (
    <g>
      {data.map((d, i) => {
        const x = xScale(d.date);
        if (x == null) return null;
        const cx = x + offset;
        const yHigh = yScale(d.high);
        const yLow = yScale(d.low);
        const yBodyTop = yScale(Math.max(d.open, d.close));
        const yBodyBottom = yScale(Math.min(d.open, d.close));
        if (yHigh == null || yLow == null || yBodyTop == null || yBodyBottom == null) return null;
        const color = d.isUp ? CHART_COLORS.up : CHART_COLORS.down;
        return (
          <g key={i}>
            <line x1={cx} y1={yHigh} x2={cx} y2={yBodyTop} stroke={color} strokeWidth={1} />
            <line x1={cx} y1={yBodyBottom} x2={cx} y2={yLow} stroke={color} strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
}

function ChartSection({ data, periodLabel, benchmarkName }: ChartSectionProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card px-6 py-10 h-[320px] flex items-center justify-center text-muted-foreground font-medium">
        데이터가 없습니다.
      </div>
    );
  }

  const labelMap: Record<string, string> = { "일봉": "일봉", "주봉": "주봉", "월봉": "월봉" };
  const maxVolume = Math.max(...data.map((d) => d.volume || 0), 1);
  const interval = Math.floor(data.length / 4);
  const hasBenchmarkData = data.some((d) => d.benchmark !== null);

  return (
    <div className="bg-card px-6 py-10">
      <div className="mb-4">
        <span className="text-muted-foreground text-sm font-bold">{labelMap[periodLabel]}</span>
      </div>
      {/* 범례 */}
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: CHART_COLORS.ma5 }} />
          <span className="text-muted-foreground">MA5</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: CHART_COLORS.ma20 }} />
          <span className="text-muted-foreground">MA20</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: CHART_COLORS.ma60 }} />
          <span className="text-muted-foreground">MA60</span>
        </span>
        {hasBenchmarkData && (
          <span className="flex items-center gap-1">
            <svg width="16" height="4" viewBox="0 0 16 4">
              <line x1="0" y1="2" x2="16" y2="2" stroke={CHART_COLORS.benchmark} strokeWidth="1.5" strokeDasharray="4 2" />
            </svg>
            <span className="text-muted-foreground">{benchmarkName || "벤치마크"}</span>
          </span>
        )}
      </div>

      {/* 캔들 + 라인 차트 */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fontWeight: 500 }}
              stroke={CHART_COLORS.cursor}
              interval={interval}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              content={<CandleTooltip />}
              cursor={{ stroke: CHART_COLORS.cursor, strokeWidth: 1, strokeDasharray: "4 4" }}
            />

            {/* 투명 베이스: bodyLow 위치까지 올려줌 */}
            <Bar dataKey="bodyLow" stackId="candle" fill="transparent" stroke="none" isAnimationActive={false} maxBarSize={10} />
            {/* 캔들 몸통: bodyLow에서 bodyHeight만큼 */}
            <Bar dataKey="bodyHeight" stackId="candle" isAnimationActive={false} maxBarSize={10} radius={[1, 1, 1, 1]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.isUp ? CHART_COLORS.up : CHART_COLORS.down} />
              ))}
            </Bar>

            {/* wick(꼬리) */}
            <Customized
              component={(props: Record<string, unknown>) => (
                <CandleWicks
                  xAxisMap={props.xAxisMap as CandleWicksProps["xAxisMap"]}
                  yAxisMap={props.yAxisMap as CandleWicksProps["yAxisMap"]}
                  data={data}
                />
              )}
            />

            {/* MA 라인들 */}
            <Line type="monotone" dataKey="ma5"  stroke={CHART_COLORS.ma5}  strokeWidth={1} dot={false} animationDuration={0} connectNulls />
            <Line type="monotone" dataKey="ma20" stroke={CHART_COLORS.ma20} strokeWidth={1} dot={false} animationDuration={0} connectNulls />
            <Line type="monotone" dataKey="ma60" stroke={CHART_COLORS.ma60} strokeWidth={1} dot={false} animationDuration={0} connectNulls />

            {/* 벤치마크 라인 — 회색 점선 (데이터 있을 때만) */}
            {hasBenchmarkData && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke={CHART_COLORS.benchmark}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                animationDuration={600}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 거래량 패널 */}
      <div className="h-16 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 0, right: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, maxVolume * 1.2]} />
            <Tooltip
              content={<CandleTooltip />}
              cursor={{ stroke: CHART_COLORS.cursor, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Bar dataKey="volume" isAnimationActive={false} maxBarSize={10} radius={[1, 1, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.isUp ? CHART_COLORS.upAlpha : CHART_COLORS.downAlpha} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground font-medium">거래량</div>
    </div>
  );
}

function CandleTooltip({ active, payload }: CandleTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl min-w-[160px]">
      <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">{d.date}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold">
        <span className="text-muted-foreground">시가</span>
        <span className="text-foreground text-right">₩{d.open?.toLocaleString()}</span>
        <span className="text-muted-foreground">고가</span>
        <span className="text-right" style={{ color: CHART_COLORS.up }}>₩{d.high?.toLocaleString()}</span>
        <span className="text-muted-foreground">저가</span>
        <span className="text-right" style={{ color: CHART_COLORS.down }}>₩{d.low?.toLocaleString()}</span>
        <span className="text-muted-foreground">종가</span>
        <span className="text-right font-bold" style={{ color: d.isUp ? CHART_COLORS.up : CHART_COLORS.down }}>
          ₩{d.close?.toLocaleString()}
        </span>
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

function RsiCard({ rsi, isLoading }: RsiCardProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-4">
        <Skeleton className="h-28 w-full rounded-3xl" />
      </div>
    );
  }
  if (rsi === null) return null;

  const pct = Math.min(100, Math.max(0, rsi));
  const label = rsi < 30 ? "과매도 구간" : rsi > 70 ? "과매수 구간" : "적정 구간";

  return (
    <div className="px-6 py-4">
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
        <p className="text-foreground font-bold text-base mb-4">이 주식의 체력은?</p>
        <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium">
          <span>차가움</span>
          <span>적당함</span>
          <span>뜨거움</span>
        </div>
        <div
          className="relative h-3 rounded-full"
          style={{ background: "linear-gradient(to right, var(--down-color), var(--primary), var(--up-color))" }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-foreground rounded-full shadow"
            style={{ left: `${pct}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
          RSI {rsi} · {label}
        </p>
      </div>
    </div>
  );
}

function ComparisonSection({ returnsData }: ComparisonSectionProps) {
  return (
    <div className="px-6 py-10">
      <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
        <div className="text-foreground mb-6 font-bold text-xl md:text-2xl">수익률 비교</div>
        {/* 헤더 */}
        <div className="grid grid-cols-3 text-xs font-bold text-muted-foreground mb-3">
          <span>기간</span>
          <span className="text-center">종목</span>
          <span className="text-right">벤치마크</span>
        </div>
        <div className="space-y-3">
          {returnsData.map(({ label, data, isLoading }) => {
            const stockRate = data?.stockReturnRate;
            const benchRate = data?.benchmarkReturnRate;
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
                    <span className="text-center font-bold text-sm">
                      <SignedValueLabel value={stockRate} format="percent" ariaLabelPrefix={`${label} 종목 수익률`} fallback="-" />
                    </span>
                    <span className="text-right font-bold text-sm">
                      {benchRate != null
                        ? <SignedValueLabel value={benchRate} format="percent" ariaLabelPrefix={`${label} 벤치마크 수익률`} />
                        : <span className="text-muted-foreground font-medium">데이터 없음</span>}
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
