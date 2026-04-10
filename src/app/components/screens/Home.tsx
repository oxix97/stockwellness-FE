import { useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, BarChart2, Bell } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth";
import { useMarketIndex } from "@/hooks/use-market-index";
import { Section } from "@/app/components/shared";
import { MarketIndexSection } from "@/app/components/home/MarketIndexCard";
import { getMarketWeatherPresentation } from "@/app/components/home/market-weather-presentation";
import { StockSupplyRankingSection } from "@/app/components/home/StockSupplyRankingSection";
import { SectorRankingSection } from "@/app/components/home/SectorRankingSection";
import { NewListingsSection } from "@/app/components/home/NewListingsSection";
import { SectorBottomSheet, SectorData } from "@/app/components/home/SectorBottomSheet";

export function Home() {
  const navigate = useNavigate();
  const nickname = useAuthStore((state) => state.nickname);
  const { data: marketDashboard, isLoading, isError } = useMarketIndex();
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const greeting = getMarketWeatherPresentation(marketDashboard?.weather, isLoading, isError);

  return (
    <div className="min-h-full pb-6">
      {/* 헤더 — 알림 벨 */}
      <header className="px-4 py-3 flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-[calc(100vw-5.5rem)]"
        >
          <span className="text-foreground font-bold text-2xl leading-snug">
            {nickname ?? "투자자"}님,<br />{greeting.text} {greeting.emoji}
          </span>
          <span className={`mt-2 block text-sm font-medium leading-5 ${greeting.toneClassName}`}>
            {greeting.description}
          </span>
        </motion.p>
        <div className="flex items-center gap-3 shrink-0 self-start mt-1">
          {/* 알림 벨 */}
          <button
            onClick={() => navigate("/more/notifications")}
            className="p-2 rounded-full bg-secondary text-muted-foreground"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 시장 인덱스 미니카드 */}
      <Section title="시장 현황" icon={BarChart2}>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <MarketIndexSection />
        </div>
      </Section>

      {/* 섹터 등락률 랭킹 (Function 26) */}
      <Section title="오늘의 업종 지수 랭킹" icon={TrendingUp} className="mt-2">
        <SectorRankingSection onSectorClick={setSelectedSector} />
      </Section>

      {/* 수급 상위 섹터 */}
      <StockSupplyRankingSection />

      {/* 순매도 상위 */}
      <StockSupplyRankingSection direction="SELL" />

      {/* 신규 상장 */}
      <Section title="신규 상장" icon={TrendingUp}>
        <NewListingsSection />
      </Section>

      {/* 섹터 상세 정보 바텀 시트 (Function 30, 31) */}
      <SectorBottomSheet 
        sector={selectedSector} 
        onClose={() => setSelectedSector(null)} 
      />
    </div>
  );
}
