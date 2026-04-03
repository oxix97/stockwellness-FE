import { motion } from "motion/react";
import { Progress } from "@/app/components/ui";
import { useSupply } from "@/hooks/use-supply";
import { SectorSupplyItem } from "@/types/api";
import { HomeCard, HomeCardSkeleton, getSectorIcon } from "./HomeCard";
import { HomeBadge } from "./HomeListItem";
import { formatCurrency } from "@/utils/format";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Task #75 — 수급 상위 섹터 가로 스크롤 카드 리팩터링
 */
export function SupplyDemandSection() {
  const { data, isLoading } = useSupply(5);

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {[1, 2, 3].map((i) => (
          <HomeCardSkeleton key={i} />
        ))}
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      {data.map((sector) => (
        <SupplyCard key={sector.sectorCode} sector={sector} maxAmount={maxAmount} />
      ))}
    </motion.div>
  );
}

function SupplyCard({
  sector,
  maxAmount,
}: {
  sector: SectorSupplyItem;
  maxAmount: number;
}) {
  const instAmt = Math.abs(sector.netInstBuyAmount);
  const foreignAmt = Math.abs(sector.netForeignBuyAmount);
  
  const dominant = instAmt >= foreignAmt ? "기관" : "외국인";
  const dominantIcon = dominant === "기관" ? "🏢" : "🌍";
  const dominantAmt = dominant === "기관" ? instAmt : foreignAmt;
  const secondaryAmt = dominant === "기관" ? foreignAmt : instAmt;
  
  const consecutiveDays =
    dominant === "기관"
      ? sector.instConsecutiveBuyDays
      : sector.foreignConsecutiveBuyDays;

  const progressValue = maxAmount > 0 ? (dominantAmt / maxAmount) * 100 : 0;
  const secondaryWidth = maxAmount > 0 ? (secondaryAmt / maxAmount) * 100 : 0;
  
  const formattedAmt = `${(dominantAmt / 1e8).toFixed(0)}억`;
  const badgeOpacity = consecutiveDays >= 10 ? 30 : consecutiveDays >= 5 ? 20 : 10;

  return (
    <HomeCard
      title={sector.sectorName}
      icon={
        <div className="relative inline-block">
          <span className="text-3xl">{getSectorIcon(sector.sectorName)}</span>
          <span className="absolute -bottom-1 -right-1 text-[10px] bg-background border border-border rounded-full p-0.5 shadow-sm">
            {dominantIcon}
          </span>
        </div>
      }
      badge={
        <div className="flex gap-1">
          <HomeBadge opacity={badgeOpacity as any} className="border border-primary/10">
            {dominant} {consecutiveDays}일+
          </HomeBadge>
        </div>
      }
      value={
        <span className="text-up">+{formattedAmt} 유입</span>
      }
      description={
        <div className="flex flex-col gap-1 w-full mt-1">
          <div className="relative h-1 w-full bg-muted/30 rounded-full overflow-hidden">
            <Progress 
              value={progressValue} 
              className="absolute inset-0 h-full [&>[data-slot=progress-indicator]]:bg-up" 
            />
            {secondaryAmt > 0 && (
              <div 
                className="absolute left-0 top-0 h-full bg-up/20"
                style={{ width: `${secondaryWidth}%` }}
              />
            )}
          </div>
          {secondaryAmt > 0 && (
            <span className="text-[9px] text-muted-foreground/50">
              {dominant === "기관" ? "외인" : "기관"} 동반 매수 중
            </span>
          )}
        </div>
      }
    />
  );
}
