import { useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine
} from "recharts";
import { Sparkles, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, Skeleton } from "@/app/components/ui";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { LeadingStock, TechnicalIndicators, SectorComparisonPoint, SectorComparisonResponse } from "@/types/api";
import { formatCurrency, formatSignedCurrency } from "@/utils/format";
import { getTrendClassName } from "@/utils/trend";
import { useSectorDetail, useSector } from "@/hooks/use-sector";

const CHART_COLORS = {
  up: "#FF4756",
  down: "#3182F6",
  ma5: "#F59E0B",
  ma20: "#8B5CF6",
  cursor: "#9CA3AF",
} as const;

export interface SectorData {
  sectorCode: string;
  sectorName: string;
  fluctuationRate: number;
  currentPrice?: number;
  diagnosisMessage?: string;
  leadingStocks?: LeadingStock[];
  technicalIndicators?: Partial<TechnicalIndicators> | null;
  detailLoading?: boolean;
  weatherScore?: number;
  weatherState?: string;
  weatherEmoji?: string;
  aiInsight?: string;
}

interface SectorBottomSheetProps {
  sector: SectorData | null;
  onClose: () => void;
}

export function SectorBottomSheet({ sector, onClose }: SectorBottomSheetProps) {
  return (
    <Sheet open={!!sector} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[32px] px-0 pb-10 max-h-[90vh] border-t-0 shadow-2xl">
        {sector && <SectorSheetContainer sector={sector} />}
      </SheetContent>
    </Sheet>
  );
}

function SectorSheetContainer({ sector }: { sector: SectorData }) {
  const { data: detailData, isLoading: isDetailLoading } = useSectorDetail(
    !sector.diagnosisMessage ? sector.sectorCode : null
  );
  
  const { useComparison } = useSector();
  const { data: comparisonData, isLoading: isComparisonLoading } = useComparison(sector.sectorCode);

  const mergedSector: SectorData = useMemo(() => ({
    ...sector,
    ...(detailData || {}),
    detailLoading: sector.detailLoading || isDetailLoading
  }), [sector, detailData, isDetailLoading]);

  return <SheetBody sector={mergedSector} comparison={comparisonData} isComparisonLoading={isComparisonLoading} />;
}

function SheetBody({ 
  sector, 
  comparison,
  isComparisonLoading 
}: { 
  sector: SectorData, 
  comparison?: SectorComparisonResponse,
  isComparisonLoading: boolean
}) {
  const navigate = useNavigate();
  const isUp = (sector.fluctuationRate ?? 0) >= 0;

  const handleViewAll = () => {
    navigate(`/search?sectorName=${encodeURIComponent(sector.sectorName)}`);
  };

  // 차트 기간 계산
  const dateRange = useMemo(() => {
    if (!comparison?.historicalComparison?.length) return "";
    const data = comparison.historicalComparison;
    const start = (data[0].date ?? "").replace(/-/g, ".");
    const end = (data[data.length - 1].date ?? "").replace(/-/g, ".");
    return `${start} ~ ${end}`;
  }, [comparison]);

  return (
    <div className="overflow-y-auto max-h-[85vh] scrollbar-hide">
      {/* 드래그 핸들 */}
      <div className="flex justify-center pt-3 pb-5">
        <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
      </div>

      <div className="px-6 space-y-6">
        {/* 1. MarketIndexCard 스타일 헤더 */}
        <div className={`relative overflow-hidden rounded-[24px] border p-6 transition-all ${
          isUp ? "border-up/20 bg-up/5" : "border-down/20 bg-down/5"
        }`}>
          {/* 배경 장식 */}
          <div className={`absolute -left-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-20 ${
            isUp ? "bg-up" : "bg-down"
          }`} />
          
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-2xl shadow-inner shrink-0">
              {getSectorIcon(sector.sectorName)}
            </div>
            <h2 className="text-foreground font-extrabold text-lg">{sector.sectorName}</h2>
          </div>

          <div className="relative z-10 space-y-1">
            <p className="text-foreground font-black text-3xl tabular-nums leading-none font-mono">
              {(sector.currentPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2">
              <SignedValueLabel
                value={sector.fluctuationRate}
                format="percent"
                className="text-base font-bold"
                ariaLabelPrefix={`${sector.sectorName} 등락률`}
              />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isUp ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down"
              }`}>
                {isUp ? "상승" : "하락"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. AI 인사이트 (컴팩트 카드) */}
        {(sector.diagnosisMessage || sector.aiInsight || sector.detailLoading) && (
          <div className="bg-card rounded-2xl p-4 border border-border/70 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> AI Weather Insight
              </h3>
              {sector.weatherScore !== undefined && (
                <div className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                  <span className="text-[10px] font-bold text-primary">{sector.weatherEmoji} {sector.weatherScore}점</span>
                </div>
              )}
            </div>
            {sector.detailLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ) : (
              <div className="space-y-2">
                {sector.aiInsight ? (
                  <p className="text-[13px] text-foreground font-medium leading-relaxed">{sector.aiInsight}</p>
                ) : (
                  <p className="text-[13px] text-foreground font-medium leading-relaxed">{sector.diagnosisMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. 업종 지수 트렌드 차트 (StockDetail 스타일) */}
        <div className="bg-card rounded-[24px] p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[14px] font-bold text-foreground">업종 지수 트렌드</span>
              <span className="text-[11px] text-muted-foreground ml-2">최근 30일</span>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {dateRange}
            </div>
          </div>

          <div className="h-44 w-full mb-5">
            {isComparisonLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comparison?.historicalComparison}>
                  <defs>
                    <linearGradient id="sectorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isUp ? CHART_COLORS.up : CHART_COLORS.down} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={isUp ? CHART_COLORS.up : CHART_COLORS.down} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="indexValue"
                    stroke={isUp ? CHART_COLORS.up : CHART_COLORS.down}
                    strokeWidth={2.5}
                    fill="url(#sectorGradient)"
                    dot={false}
                    isAnimationActive={true}
                  />
                  {/* MA 라인 (데이터가 있을 경우) */}
                  {sector.technicalIndicators?.ma5 && (
                    <ReferenceLine y={sector.technicalIndicators.ma5} stroke={CHART_COLORS.ma5} strokeWidth={1} strokeDasharray="3 3" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 지수 요약 그리드 */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryItem label="최고 지수" value={getStats(comparison?.historicalComparison).max} color="up" />
            <SummaryItem label="최저 지수" value={getStats(comparison?.historicalComparison).min} color="down" />
            <SummaryItem label="기간 변동" value={getStats(comparison?.historicalComparison).change} color={getStats(comparison?.historicalComparison).isUp ? "up" : "down"} isPercent />
          </div>
        </div>

        {/* 4. 구성 종목 리스트 */}
        <div className="pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-bold text-[15px]">주요 구성 종목</h3>
            {!sector.detailLoading && (
              <button onClick={handleViewAll} className="text-muted-foreground flex items-center gap-1 text-[11px] font-bold hover:text-primary transition-colors">
                전체 보기 <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="divide-y divide-border/40 rounded-2xl border border-border/60 overflow-hidden bg-card/50">
            {sector.detailLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex justify-between">
                  <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))
            ) : (
              sector.leadingStocks?.slice(0, 5).map((stock) => (
                <LeadingStockItem key={stock.ticker} stock={stock} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Partial<SectorComparisonPoint> }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const rate = data.sectorRate ?? 0;

  return (
    <div className="bg-card/90 backdrop-blur-md border border-border p-3 rounded-2xl shadow-xl min-w-[120px]">
      <div className="text-[10px] font-black text-muted-foreground mb-2 uppercase">{data.date ?? "-"}</div>
      <div className="flex justify-between items-center gap-4 mb-1">
        <span className="text-[11px] font-bold text-muted-foreground">지수</span>
        <span className="text-[13px] font-extrabold text-foreground font-mono">{(data.indexValue ?? 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center gap-4">
        <span className="text-[11px] font-bold text-muted-foreground">수익률</span>
        <SignedValueLabel value={rate} format="percent" className="text-[12px] font-extrabold font-mono" />
      </div>
    </div>
  );
}

function SummaryItem({ label, value, color, isPercent }: { label: string; value: string | number; color: "up" | "down" | "neutral"; isPercent?: boolean }) {
  const numericValue = typeof value === "number" ? value : Number(value);

  return (
    <div className="bg-secondary/20 rounded-2xl p-3 text-center border border-border/50">
      <p className="text-[10px] font-bold text-muted-foreground mb-1">{label}</p>
      {isPercent && Number.isFinite(numericValue) ? (
        <SignedValueLabel value={numericValue} format="percent" className="text-[14px] font-black font-mono" />
      ) : (
        <p className={`text-[14px] font-black font-mono ${
          color === "up" ? "text-up" : color === "down" ? "text-down" : "text-foreground"
        }`}>
          {value}
        </p>
      )}
    </div>
  );
}

function LeadingStockItem({ stock }: { stock: LeadingStock }) {
  const navigate = useNavigate();

  return (
    <motion.div 
      whileTap={{ backgroundColor: "var(--color-secondary)" }}
      onClick={() => navigate(`/stock/${stock.ticker}`)}
      className="flex items-center justify-between p-4 bg-card cursor-pointer transition-colors hover:bg-secondary/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-secondary flex items-center justify-center text-[11px] font-black text-primary shadow-sm">
          {stock.ticker.slice(-3)}
        </div>
        <div>
          <p className="text-foreground font-bold text-[14px]">{stock.name}</p>
          <p className="text-muted-foreground text-[11px] font-medium">{stock.ticker}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-foreground font-bold text-[15px] font-mono">{formatCurrency(stock.currentPrice)}원</p>
        <div className={`flex items-center justify-end gap-1 text-[12px] font-bold font-mono ${getTrendClassName(stock.fluctuationRate)}`}>
          <span>{formatSignedCurrency(stock.changePrice)}</span>
          <SignedValueLabel value={stock.fluctuationRate} format="percent" />
        </div>
      </div>
    </motion.div>
  );
}

function getSectorIcon(name: string) {
  if (name.includes("IT") || name.includes("전자") || name.includes("반도체")) return "💻";
  if (name.includes("금융") || name.includes("은행") || name.includes("증권")) return "🏦";
  if (name.includes("바이오") || name.includes("의약") || name.includes("헬스")) return "🧪";
  if (name.includes("통신") || name.includes("네트워크")) return "📡";
  if (name.includes("자동차") || name.includes("운수")) return "🚗";
  if (name.includes("에너지") || name.includes("화학")) return "🔋";
  if (name.includes("건설") || name.includes("철강")) return "🏗️";
  if (name.includes("유통") || name.includes("소비")) return "🛍️";
  if (name.includes("게임") || name.includes("콘텐츠") || name.includes("문화")) return "🎮";
  return "🏢";
}

function getStats(data?: SectorComparisonPoint[]) {
  if (!data || data.length === 0) return { max: "-", min: "-", change: "0", isUp: true };
  const values = data.map(d => d.indexValue).filter(v => typeof v === 'number');
  if (values.length === 0) return { max: "-", min: "-", change: "0", isUp: true };
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  const first = values[0];
  const last = values[values.length - 1];
  const change = first && first !== 0 ? ((last - first) / first) * 100 : 0;
  
  return {
    max: max.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    min: min.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    change: change.toFixed(2),
    isUp: change >= 0
  };
}
