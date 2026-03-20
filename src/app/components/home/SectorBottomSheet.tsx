import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Sheet, SheetContent } from "@/app/components/ui";
import { LeadingStock } from "@/types/api";
import { formatPercent } from "@/utils/format";

interface SectorData {
  sectorCode: string;
  sectorName: string;
  fluctuationRate: number;
  diagnosisMessage: string;
  leadingStocks: LeadingStock[];
  detailLoading: boolean;
}

interface SectorBottomSheetProps {
  sector: SectorData | null;
  onClose: () => void;
}

/**
 * Task #68 — 섹터 카드 탭 시 슬라이드업 바텀시트
 * 주도주 목록 + 벤치마크 비교 차트 (현재 상세 히스토리 API 미연동)
 */
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

      <div className="px-6">
        {/* 헤더 */}
        <div className="mb-4">
          <h2 className="text-foreground font-bold text-lg">{sector.sectorName}</h2>
          <p
            className="text-sm font-semibold tabular-nums"
            style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}
          >
            {formatPercent(sector.fluctuationRate)}
          </p>
        </div>

        {/* AI 진단 */}
        {sector.diagnosisMessage && (
          <div className="bg-secondary/50 rounded-xl p-3 mb-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {sector.diagnosisMessage}
            </p>
          </div>
        )}

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

function LeadingStockRow({ stock }: { stock: LeadingStock }) {
  const isUp = stock.fluctuationRate >= 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-foreground font-medium text-sm">{stock.name}</p>
        <p className="text-muted-foreground text-xs">{stock.ticker}</p>
      </div>
      <p
        className="text-sm font-semibold tabular-nums"
        style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}
      >
        {formatPercent(stock.fluctuationRate)}
      </p>
    </div>
  );
}
