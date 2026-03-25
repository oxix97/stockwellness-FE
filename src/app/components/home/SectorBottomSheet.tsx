import { Sheet, SheetContent } from "@/app/components/ui";
import { LeadingStock, TechnicalIndicators } from "@/types/api";
import { formatPercent } from "@/utils/format";

interface SectorData {
  sectorCode: string;
  sectorName: string;
  fluctuationRate: number;
  diagnosisMessage: string;
  leadingStocks: LeadingStock[];
  technicalIndicators: Partial<TechnicalIndicators> | null;
  detailLoading: boolean;
}

interface SectorBottomSheetProps {
  sector: SectorData | null;
  onClose: () => void;
}

export function SectorBottomSheet({ sector, onClose }: SectorBottomSheetProps) {
  return (
    <Sheet open={!!sector} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 max-h-[75vh]">
        {sector && <SheetBody sector={sector} />}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ sector }: { sector: SectorData }) {
  const isUp = sector.fluctuationRate >= 0;

  return (
    <div className="overflow-y-auto max-h-[70vh]">
      {/* 드래그 핸들 */}
      <div className="flex justify-center pt-3 pb-4">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      <div className="px-6 space-y-5">
        {/* 헤더 */}
        <div>
          <h2 className="text-foreground font-bold text-lg">{sector.sectorName}</h2>
          <p className="text-sm font-semibold tabular-nums" style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}>
            {formatPercent(sector.fluctuationRate)}
          </p>
        </div>

        {/* AI 진단 */}
        {sector.diagnosisMessage && (
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-sm text-muted-foreground leading-relaxed">{sector.diagnosisMessage}</p>
          </div>
        )}

        {/* 기술적 지표 */}
        <TechnicalIndicatorCard ti={sector.technicalIndicators} loading={sector.detailLoading} />

        {/* 주도주 */}
        {sector.leadingStocks.length > 0 && (
          <div>
            <h3 className="text-foreground font-semibold text-sm mb-3">주도주</h3>
            <div className="space-y-2">
              {sector.leadingStocks.slice(0, 5).map((stock) => (
                <LeadingStockRow key={stock.ticker} stock={stock} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
      <h3 className="text-foreground font-semibold text-sm">기술적 지표</h3>

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
            <span className="text-[10px] text-[#3182F6]">과매도 30</span>
            <span className="text-[10px] text-[#EF4444]">과매수 70</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">RSI 분석 중...</div>
      )}

      {/* 이동평균 뱃지 */}
      <div className="flex flex-wrap gap-2">
        {ti?.ma5 != null && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-foreground">
            MA 5: {(ti.ma5 ?? 0).toLocaleString()}
          </span>
        )}
        {ti?.ma20 != null && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-foreground">
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
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-foreground font-medium text-sm">{stock.name}</p>
        <p className="text-muted-foreground text-xs">{stock.ticker}</p>
      </div>
      <p className="text-sm font-semibold tabular-nums" style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}>
        {formatPercent(stock.fluctuationRate)}
      </p>
    </div>
  );
}
