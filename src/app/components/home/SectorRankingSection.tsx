import { motion } from "motion/react";
import { useSector } from "@/hooks/use-sector";
import { HomeCard, HomeCardSkeleton, getSectorIcon } from "./HomeCard";
import { HomeBadge } from "./HomeListItem";
import { formatPercent } from "@/utils/format";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface SectorRankingSectionProps {
  onSectorClick: (sector: any) => void;
}

/**
 * [기능 26] 등락률 상위 섹터 조회 및 표시
 */
export function SectorRankingSection({ onSectorClick }: SectorRankingSectionProps) {
  const { data, isLoading } = useSector(10);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      {data.map((sector) => (
        <RankingCard 
          key={sector.sectorCode} 
          sector={sector} 
          onClick={() => onSectorClick(sector)}
        />
      ))}
    </motion.div>
  );
}

function RankingCard({
  sector,
  onClick,
}: {
  sector: any;
  onClick: () => void;
}) {
  const isUp = sector.fluctuationRate >= 0;
  
  return (
    <HomeCard
      onTap={onClick}
      title={sector.sectorName}
      icon={getSectorIcon(sector.sectorName)}
      badge={
        sector.isOverheated && (
          <HomeBadge opacity={30} className="bg-red-500/10 text-red-500 border border-red-500/20">
            과열 🔥
          </HomeBadge>
        )
      }
      displayValue={
        <span className={isUp ? "text-up" : "text-down"}>
          {isUp ? "▲ " : "▼ "}{Math.abs(sector.fluctuationRate).toFixed(2)}%
        </span>
      }
    />
  );
}
