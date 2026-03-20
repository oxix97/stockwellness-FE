import { Progress, Skeleton } from "@/app/components/ui";
import { useSupply } from "@/hooks/use-supply";
import { SectorSupplyItem } from "@/types/api";

/**
 * Task #69 — 기관/외국인 수급 상위 섹터 Progress bar 리스트
 */
export function SupplyDemandSection() {
  const { data, isLoading } = useSupply(5);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // 최대값 기준 게이지 정규화
  const maxAmount = Math.max(
    ...data.flatMap((s) => [
      Math.abs(s.netForeignBuyAmount),
      Math.abs(s.netInstBuyAmount),
    ])
  );

  return (
    <div className="space-y-3">
      {data.map((sector) => (
        <SupplyRow key={sector.sectorCode} sector={sector} maxAmount={maxAmount} />
      ))}
    </div>
  );
}

function SupplyRow({
  sector,
  maxAmount,
}: {
  sector: SectorSupplyItem;
  maxAmount: number;
}) {
  const instAmt = Math.abs(sector.netInstBuyAmount);
  const foreignAmt = Math.abs(sector.netForeignBuyAmount);
  const dominant = instAmt >= foreignAmt ? "기관" : "외국인";
  const dominantAmt = dominant === "기관" ? instAmt : foreignAmt;
  const consecutiveDays =
    dominant === "기관"
      ? sector.instConsecutiveBuyDays
      : sector.foreignConsecutiveBuyDays;

  const progressValue = maxAmount > 0 ? (dominantAmt / maxAmount) * 100 : 0;
  const formattedAmt = `+${(dominantAmt / 1e8).toFixed(0)}억`;

  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold text-sm">{sector.sectorName}</span>
          {consecutiveDays >= 3 && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {consecutiveDays}일 연속
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-[11px] text-muted-foreground">{dominant} </span>
          <span className="text-[11px] font-semibold text-primary tabular-nums">{formattedAmt}</span>
        </div>
      </div>
      <Progress value={progressValue} className="h-1.5" />
    </div>
  );
}
