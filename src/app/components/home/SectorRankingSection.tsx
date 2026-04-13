import { motion } from "motion/react";
import { useSector } from "@/hooks/use-sector";
import { HomeCard, HomeCardSkeleton } from "./HomeCard";
import { HomeBadge } from "./HomeListItem";
import { getSectorIcon } from "./sector-icon";

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
  const tone = getSectorTone(isUp);
  
  return (
    <HomeCard
      onTap={onClick}
      title={sector.sectorName}
      icon={getSectorIcon(sector.sectorName)}
      surfaceDecoration={tone.decoration}
      className={tone.cardClassName}
      badge={
        sector.isOverheated && (
          <HomeBadge opacity={30} className={tone.badgeClassName}>
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

function getSectorTone(isUp: boolean) {
  if (isUp) {
    return {
      cardClassName:
        "border-red-100/80 hover:border-red-300/40 dark:border-red-400/10 dark:hover:border-red-400/25 dark:bg-card",
      badgeClassName:
        "border border-red-200/60 bg-red-500/12 text-red-600 dark:border-red-400/20 dark:bg-red-500/18 dark:text-red-200",
      decoration: (
        <>
          {/* Breathing Glow */}
          <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-red-400/20 blur-2xl animate-healing-breath dark:bg-red-400/25" />
          <div className="absolute left-0 top-0 h-20 w-full bg-gradient-to-br from-red-500/12 via-orange-400/8 to-transparent dark:from-red-400/16 dark:via-orange-300/10" />
          
          {/* Edge Highlight */}
          <div className="absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-red-500/40 via-red-400/10 to-transparent" />
          <div className="absolute left-0 top-0 w-px h-16 bg-gradient-to-b from-red-500/40 via-red-400/10 to-transparent" />
          
          <div className="absolute left-4 top-4 h-px w-14 rotate-[-24deg] bg-gradient-to-r from-transparent via-red-300/50 to-transparent dark:via-red-300/35" />
        </>
      ),
    };
  }

  return {
    cardClassName:
      "border-sky-100/90 hover:border-sky-300/40 dark:border-sky-400/10 dark:hover:border-sky-400/25 dark:bg-card",
    badgeClassName:
      "border border-blue-200/60 bg-blue-500/12 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/18 dark:text-blue-200",
    decoration: (
      <>
        {/* Breathing Glow */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl animate-healing-breath dark:bg-sky-400/25" />
        <div className="absolute right-0 top-0 h-20 w-full bg-gradient-to-bl from-sky-500/12 via-blue-400/8 to-transparent dark:from-sky-400/16 dark:via-blue-300/10" />
        
        {/* Edge Highlight */}
        <div className="absolute right-0 top-0 h-px w-24 bg-gradient-to-l from-sky-500/40 via-sky-400/10 to-transparent" />
        <div className="absolute right-0 top-0 w-px h-16 bg-gradient-to-b from-sky-500/40 via-sky-400/10 to-transparent" />

        <div className="absolute right-4 top-4 h-px w-16 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent dark:via-sky-300/35" />
      </>
    ),
  };
}
