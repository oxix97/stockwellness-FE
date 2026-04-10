import { motion } from "motion/react";
import { Skeleton } from "@/app/components/ui";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MarketIndexResult } from "@/types/api";

/**
 * Task #67 — 시장 인덱스 미니카드 (KOSPI / KOSDAQ / S&P500)
 */
export function MarketIndexSection() {
  const { data, isLoading } = useMarketIndex();
  const indexes = data?.indexes;

  if (isLoading) {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="min-w-[240px] h-[150px] rounded-2xl" />
        ))}
      </>
    );
  }

  if (!indexes || indexes.length === 0) return null;

  return (
    <>
      {indexes.map((index, idx) => (
        <motion.div
          key={index.name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.08 }}
          className="min-w-[240px]"
        >
          <MarketIndexCard index={index} />
        </motion.div>
      ))}
    </>
  );
}

function MarketIndexCard({ index }: { index: MarketIndexResult }) {
  const isUp = index.fluctuationRate >= 0;
  
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
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col justify-between h-[150px] text-left">
      <div className="flex items-center gap-3">
        {/* 상단 좌측: 아이콘 + 시장 이름 */}
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shadow-inner shrink-0">
          {getIndexIcon(index.name)}
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-bold text-base truncate">
            {index.name}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {/* 하단: 지수 및 등락 정보 */}
        <p className="text-foreground font-bold text-2xl tabular-nums leading-none">
          {(index.currentPrice ?? 0).toLocaleString("ko-KR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        <p className={`text-sm font-bold tabular-nums ${isUp ? "text-up" : "text-down"}`}>
          {isUp ? "▲" : "▼"} {Math.abs(index.fluctuationRate).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
