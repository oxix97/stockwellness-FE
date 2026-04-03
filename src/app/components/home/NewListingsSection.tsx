import { motion } from "motion/react";
import { useStock } from "@/hooks/use-stock";
import { NewListingStock } from "@/types/api";
import { HomeCard, HomeCardSkeleton, getSectorIcon } from "./HomeCard";
import { HomeBadge } from "./HomeListItem";

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
 * Task #76 — 신규 상장 종목 가로 스크롤 카드 리팩터링
 */
export function NewListingsSection() {
  const { data, isLoading } = useStock().newListings;

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
      {data.slice(0, 10).map((stock) => (
        <NewListingCard key={stock.ticker} stock={stock} />
      ))}
    </motion.div>
  );
}

function NewListingCard({ stock }: { stock: NewListingStock }) {
  const sectorIcon = stock.sectorName ? getSectorIcon(stock.sectorName) : "🏢";
  
  return (
    <HomeCard
      title={stock.name}
      icon={
        <div className="relative inline-block">
          <span className="text-3xl">{sectorIcon}</span>
          <span className="absolute -top-1 -right-1 text-xs animate-bounce">✨</span>
        </div>
      }
      badge={
        <div className="flex gap-1">
          <HomeBadge opacity={20} className="bg-primary/20 text-primary border border-primary/20">
            NEW
          </HomeBadge>
          {stock.status === "HOT" && (
            <HomeBadge className="bg-orange-500/10 text-orange-500 border border-orange-500/20">🔥 HOT</HomeBadge>
          )}
        </div>
      }
      value={
        <span className="text-primary">{stock.marketType}</span>
      }
      description={
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium">{stock.ticker}</span>
          {stock.sectorName && (
            <span className="text-[10px] text-muted-foreground truncate">{stock.sectorName}</span>
          )}
        </div>
      }
    />
  );
}
