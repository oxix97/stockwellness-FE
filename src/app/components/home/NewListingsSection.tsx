import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useStock } from "@/hooks/use-stock";
import { NewListingStock } from "@/types/api";
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

const newListingTone = {
  cardClassName:
    "border-emerald-100/80 hover:border-emerald-300/40 dark:border-emerald-400/10 dark:hover:border-emerald-400/25 dark:bg-card",
  decoration: (
    <>
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-400/15" />
      <div className="absolute left-0 top-0 h-16 w-full bg-gradient-to-br from-emerald-500/10 via-lime-400/6 to-transparent dark:from-emerald-400/14 dark:via-lime-300/8" />
      <div className="absolute right-0 bottom-0 h-14 w-28 bg-gradient-to-tl from-emerald-300/8 via-transparent to-transparent dark:from-emerald-300/10" />
      <div className="absolute left-4 top-4 h-px w-14 rotate-[-18deg] bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent dark:via-emerald-300/30" />
    </>
  ),
  newBadgeClassName:
    "border border-emerald-200/60 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/18 dark:text-emerald-200",
  hotBadgeClassName:
    "border border-lime-200/60 bg-lime-500/10 text-lime-700 dark:border-lime-400/20 dark:bg-lime-500/16 dark:text-lime-200",
  marketTypeClassName: "text-primary dark:text-emerald-300",
};

/**
 * Task #76 — 신규 상장 종목 가로 스크롤 카드 리팩터링
 */
export function NewListingsSection() {
  const { data, isLoading } = useStock().newListings;

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
      {data.map((stock) => (
        <NewListingCard key={stock.ticker} stock={stock} />
      ))}
    </motion.div>
  );
}

function NewListingCard({ stock }: { stock: NewListingStock }) {
  const navigate = useNavigate();
  const sectorIcon = stock.sectorName ? getSectorIcon(stock.sectorName) : "🏢";
  
  return (
    <HomeCard
      onTap={() => navigate(`/stock/${stock.ticker}`)}
      title={stock.name}
      surfaceDecoration={newListingTone.decoration}
      icon={
        <div className="relative inline-block">
          <span className="text-3xl">{sectorIcon}</span>
          <span className="absolute -top-1 -right-1 text-xs animate-bounce">✨</span>
        </div>
      }
      badge={
        <div className="flex gap-1">
          <HomeBadge opacity={20} className={newListingTone.newBadgeClassName}>
            NEW
          </HomeBadge>
          {stock.status === "HOT" && (
            <HomeBadge className={newListingTone.hotBadgeClassName}>🔥 HOT</HomeBadge>
          )}
        </div>
      }
      displayValue={
        <span className={newListingTone.marketTypeClassName}>{stock.marketType}</span>
      }
      description={
        stock.sectorName && (
          <span className="text-[10px] text-muted-foreground truncate">{stock.sectorName}</span>
        )
      }
      className={newListingTone.cardClassName}
    />
  );
}
