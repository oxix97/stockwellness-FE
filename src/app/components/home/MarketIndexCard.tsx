import { motion } from "motion/react";
import { Skeleton } from "@/app/components/ui";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MarketIndexResult } from "@/types/api";
import { HomeBadge } from "./HomeListItem";

/**
 * Task #67 — 시장 인덱스 미니카드 (KOSPI / KOSDAQ / S&P500)
 */
export function MarketIndexSection() {
  const { data, isLoading } = useMarketIndex();
  const indexes = data?.indexes;

  if (isLoading) {
    return (
      <div className="responsive-scroll-row">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[var(--mobile-scroll-card-height)] min-w-[var(--mobile-scroll-card-width)] rounded-[var(--mobile-card-radius)]" />
        ))}
      </div>
    );
  }

  if (!indexes || indexes.length === 0) return null;

  return (
    <div className="responsive-scroll-row">
      {indexes.map((index, idx) => (
        <motion.div
          key={index.name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.08 }}
          className="min-w-[var(--mobile-scroll-card-width)] lg:min-w-0"
        >
          <MarketIndexCard index={index} />
        </motion.div>
      ))}
    </div>
  );
}

function MarketIndexCard({ index }: { index: MarketIndexResult }) {
  const isUp = index.fluctuationRate >= 0;
  const tone = getMarketTone(isUp);
  
  // 시장별 아이콘 결정 로직 (한글/영어 대응)
  const getIndexIcon = (name: string) => {
    const upperName = name.toUpperCase();
    
    // 한국
    if (upperName.includes("KOSPI") || upperName.includes("KOSDAQ") || 
        upperName.includes("코스피") || upperName.includes("코스닥")) {
      return "🇰🇷";
    }
    
    // 미국
    if (upperName.includes("S&P") || upperName.includes("NASDAQ") || 
        upperName.includes("나스닥") || upperName.includes("DOW") || 
        upperName.includes("다우") || upperName.includes("PHLX") || 
        upperName.includes("반도체") || upperName.includes("NY") || 
        upperName.includes("뉴욕")) {
      return "🇺🇸";
    }
    
    // 기타 글로벌
    return "🌍";
  };

  return (
    <div className={`bg-card relative flex h-[var(--mobile-scroll-card-height)] flex-col justify-between overflow-hidden rounded-[var(--mobile-card-radius)] border p-[var(--mobile-card-padding)] text-left shadow-sm transition-all duration-300 lg:rounded-2xl lg:p-5 ${tone.cardClassName}`}>
      {/* 배경 장식 (Surface Decoration) */}
      {tone.decoration}

      <div className="flex items-center gap-3 relative z-10">
        {/* 상단 좌측: 아이콘 + 시장 이름 */}
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shadow-inner shrink-0">
          {getIndexIcon(index.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-[15px] font-bold min-[408px]:text-base">
            {index.name}
          </p>
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        {/* 하단: 지수 및 등락 정보 */}
        <p className="text-foreground font-bold text-[calc(var(--mobile-number-xl)-4px)] tabular-nums leading-none min-[408px]:text-2xl">
          {(index.currentPrice ?? 0).toLocaleString("ko-KR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold tabular-nums ${isUp ? "text-up" : "text-down"}`}>
            {isUp ? "▲ " : "▼ "}{Math.abs(index.fluctuationRate).toFixed(2)}%
          </p>
          <HomeBadge opacity={20} className={`text-[10px] py-0 px-1.5 h-4 ${tone.badgeClassName}`}>
            {isUp ? "상승" : "하락"}
          </HomeBadge>
        </div>
      </div>
    </div>
  );
}

function getMarketTone(isUp: boolean) {
  if (isUp) {
    return {
      cardClassName:
        "border-red-100/80 hover:border-red-300/40 dark:border-red-400/10 dark:hover:border-red-400/25",
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
      "border-sky-100/90 hover:border-sky-300/40 dark:border-sky-400/10 dark:hover:border-sky-400/25",
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
