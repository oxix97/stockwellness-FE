import { motion } from "motion/react";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { useSector } from "@/hooks/use-sector";
import { HomeCard, HomeCardSkeleton } from "./HomeCard";
import { HomeBadge } from "./HomeListItem";
import { getHomeCardTone } from "./home-card-tone";
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
      <div className="responsive-scroll-row">
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
      className="responsive-scroll-row"
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
  const tone = getHomeCardTone(isUp ? "up" : "down");
  
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
        <SignedValueLabel
          value={sector.fluctuationRate}
          format="percent"
          ariaLabelPrefix={`${sector.sectorName} 등락률`}
        />
      }
    />
  );
}
