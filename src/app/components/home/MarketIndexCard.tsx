import { motion } from "motion/react";
import { Skeleton } from "@/app/components/ui";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MarketIndexResult } from "@/types/api";
import { HomeBadge } from "./HomeListItem";
import { getHomeCardTone } from "./home-card-tone";

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
  const tone = getHomeCardTone(index.fluctuationRate >= 0 ? "up" : "down");
  
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
          <SignedValueLabel
            value={index.fluctuationRate}
            format="percent"
            className="text-sm font-bold"
            ariaLabelPrefix={`${index.name} 등락률`}
          />
          <HomeBadge opacity={20} className={`text-[10px] py-0 px-1.5 h-4 ${tone.badgeClassName}`}>
            {index.fluctuationRate > 0 ? "상승" : index.fluctuationRate < 0 ? "하락" : "보합"}
          </HomeBadge>
        </div>
      </div>
    </div>
  );
}
