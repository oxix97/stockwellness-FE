import { useNavigate } from "react-router";
import { Sheet, SheetContent } from "@/app/components/ui";
import { LeadingStock, TechnicalIndicators, SectorComparisonResponse } from "@/types/api";
import { formatPercent } from "@/utils/format";
import { useSectorDetail, useSector } from "@/hooks/use-sector";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export interface SectorData {
  sectorCode: string;
  sectorName: string;
  fluctuationRate: number;
  diagnosisMessage?: string;
  leadingStocks?: LeadingStock[];
  technicalIndicators?: Partial<TechnicalIndicators> | null;
  detailLoading?: boolean;
}

interface SectorBottomSheetProps {
  sector: SectorData | null;
  onClose: () => void;
}

export function SectorBottomSheet({ sector, onClose }: SectorBottomSheetProps) {
  return (
    <Sheet open={!!sector} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 max-h-[85vh]">
        {sector && <SectorSheetContainer sector={sector} />}
      </SheetContent>
    </Sheet>
  );
}

function SectorSheetContainer({ sector }: { sector: SectorData }) {
  const { data: detailData, isLoading: isDetailLoading } = useSectorDetail(
    // diagnosisMessage가 없으면 fetch 필요함 (RankingData는 일부 필드가 없을 수 있음)
    !sector.diagnosisMessage ? sector.sectorCode : null
  );
  
  const { useComparison } = useSector();
  const { data: comparisonData, isLoading: isComparisonLoading } = useComparison(sector.sectorCode);

  const mergedSector: SectorData = {
    ...sector,
    ...(detailData || {}),
    detailLoading: sector.detailLoading || isDetailLoading
  };

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
  const isUp = sector.fluctuationRate >= 0;
  const navigate = useNavigate();

  const handleViewAll = () => {
    // 이름 기반 통합 검색을 위해 sectorName을 전달 (sectorCode는 비워서 통합 검색 유도)
    navigate(`/search?sectorName=${encodeURIComponent(sector.sectorName)}`);
  };

  return (
    <div className="overflow-y-auto max-h-[80vh] scrollbar-hide">
      {/* 드래그 핸들 */}
      <div className="flex justify-center pt-3 pb-4">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="px-6 space-y-6">
        {/* 헤더 */}
        <div>
          <h2 className="text-foreground font-bold text-xl">{sector.sectorName}</h2>
          <p className={`text-lg font-bold tabular-nums ${isUp ? "text-up" : "text-down"}`}>
            {formatPercent(sector.fluctuationRate)}
          </p>
        </div>

        {/* AI 진단 */}
        {(sector.diagnosisMessage || sector.detailLoading) && (
          <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <span>🤖</span> AI 인사이트
            </h3>
            {sector.detailLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted/50 rounded animate-pulse" />
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{sector.diagnosisMessage}</p>
            )}
          </div>
        )}

        {/* 시장 대비 수익률 비교 (Function 31) */}
        <ComparisonCard data={comparison} isLoading={isComparisonLoading} />

        {/* 기술적 지표 */}
        <TechnicalIndicatorCard ti={sector.technicalIndicators || null} loading={!!sector.detailLoading} />

        {/* 주도주 및 전체 종목 연결 */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-bold text-sm">섹터 종목</h3>
            {!sector.detailLoading && sector.leadingStocks && sector.leadingStocks.length > 0 && (
              <button 
                onClick={handleViewAll}
                className="text-primary text-xs font-bold"
              >
                전체 보기
              </button>
            )}
          </div>
          
          {sector.detailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-muted/50 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {sector.leadingStocks && sector.leadingStocks.length > 0 ? (
                sector.leadingStocks.slice(0, 5).map((stock) => (
                  <LeadingStockRow key={stock.ticker} stock={stock} />
                ))
              ) : (
                <button 
                  onClick={handleViewAll}
                  className="w-full py-6 text-center bg-secondary/20 rounded-2xl border border-dashed border-border hover:bg-secondary/30 transition-colors group"
                >
                  <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    주도주 데이터 분석 중이거나 정보가 부족합니다.
                  </p>
                  <p className="mt-2 text-primary text-xs font-bold flex items-center justify-center gap-1">
                    이 섹터의 모든 종목 보기 <span>→</span>
                  </p>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({ data, isLoading }: { data?: SectorComparisonResponse, isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 h-[200px] flex items-center justify-center">
        <div className="text-xs text-muted-foreground animate-pulse">수익률 분석 중...</div>
      </div>
    );
  }

  if (!data || !data.comparisonData || data.comparisonData.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-bold text-sm">시장 대비 수익률</h3>
        <span className="text-[10px] text-muted-foreground">최근 1개월</span>
      </div>
      
      <div className="h-[140px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.comparisonData}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)',
                borderRadius: '12px',
                fontSize: '10px'
              }}
              labelStyle={{ display: 'none' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Line 
              name={sectorNameMap(data.sectorName)} 
              type="monotone" 
              dataKey="sectorReturn" 
              stroke="#2EBE7A" 
              strokeWidth={2} 
              dot={false} 
            />
            <Line 
              name={data.benchmarkName} 
              type="monotone" 
              dataKey="benchmarkReturn" 
              stroke="#94A3B8" 
              strokeWidth={1.5} 
              strokeDasharray="4 4" 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const sectorNameMap = (name: string) => {
  if (name.length > 6) return name.substring(0, 5) + '..';
  return name;
}

function TechnicalIndicatorCard({ ti, loading }: { ti: Partial<TechnicalIndicators> | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
        <div className="h-3 w-full bg-secondary rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-secondary rounded animate-pulse" />
      </div>
    );
  }

  const rsi = ti?.rsi14;
  const hasAnyData = rsi != null || ti?.ma5 != null || ti?.ma20 != null;

  if (!hasAnyData) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs text-muted-foreground text-center">기술적 지표 분석 중...</p>
      </div>
    );
  }

  // RSI 구간 색상
  const rsiColor =
    rsi == null ? "#9CA3AF"
    : rsi >= 70 ? "#EF4444"
    : rsi <= 30 ? "#3182F6"
    : "#2EBE7A";

  const rsiLabel =
    rsi == null ? null
    : rsi >= 70 ? "과매수"
    : rsi <= 30 ? "과매도"
    : "중립";

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <h3 className="text-foreground font-bold text-sm">기술적 지표</h3>

      {/* RSI 게이지 */}
      {rsi != null ? (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">RSI (14)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tabular-nums" style={{ color: rsiColor }}>
                {rsi.toFixed(1)}
              </span>
              {rsiLabel && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${rsiColor}20`, color: rsiColor }}
                >
                  {rsiLabel}
                </span>
              )}
            </div>
          </div>
          {/* 게이지 바 */}
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            {/* 과매도 구간 (0~30) */}
            <div className="absolute left-0 top-0 h-full w-[30%] bg-[#3182F6]/20 rounded-l-full" />
            {/* 과매수 구간 (70~100) */}
            <div className="absolute right-0 top-0 h-full w-[30%] bg-[#EF4444]/20 rounded-r-full" />
            {/* 현재값 인디케이터 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
              style={{ left: `calc(${rsi}% - 6px)`, backgroundColor: rsiColor }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#3182F6]">과매도</span>
            <span className="text-[10px] text-[#EF4444]">과매수</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">RSI 분석 중...</div>
      )}

      {/* 이동평균 뱃지 */}
      <div className="flex flex-wrap gap-2 pt-1">
        {ti?.ma5 != null && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-border/50">
            MA 5: {(ti.ma5 ?? 0).toLocaleString()}
          </span>
        )}
        {ti?.ma20 != null && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-secondary text-foreground border border-border/50">
            MA 20: {(ti.ma20 ?? 0).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function LeadingStockRow({ stock }: { stock: LeadingStock }) {
  const isUp = stock.fluctuationRate >= 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div>
        <p className="text-foreground font-semibold text-sm">{stock.name}</p>
        <p className="text-muted-foreground text-[10px]">{stock.ticker}</p>
      </div>
      <p className={`text-sm font-bold tabular-nums ${isUp ? "text-up" : "text-down"}`}>
        {isUp ? "▲ " : "▼ "}{Math.abs(stock.fluctuationRate).toFixed(2)}%
      </p>
    </div>
  );
}
