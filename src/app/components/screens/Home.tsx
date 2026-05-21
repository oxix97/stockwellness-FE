import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BarChart2, Sprout, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/app/components/ui";
import { ContextHeader, GardenEmptyState, Section } from "@/app/components/shared";
import { useAuthStore } from "@/store/auth";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MarketIndexSection } from "@/app/components/home/MarketIndexCard";
import { MarketWeatherWidget } from "@/app/components/home/MarketWeatherWidget";
import { StockSupplyRankingSection } from "@/app/components/home/StockSupplyRankingSection";
import { SectorRankingSection } from "@/app/components/home/SectorRankingSection";
import { NewListingsSection } from "@/app/components/home/NewListingsSection";
import { SectorBottomSheet, SectorData } from "@/app/components/home/SectorBottomSheet";

export function Home() {
  const navigate = useNavigate();
  const nickname = useAuthStore((state) => state.nickname);
  const { data: marketDashboard, isLoading, isError } = useMarketIndex();
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

  return (
    <div className="min-h-full pb-6">
      <div className="page-shell page-content pt-4 md:pt-6 flex justify-end">
        <button
          onClick={() => navigate("/more/notifications")}
          className="rounded-full border border-border/70 bg-card/80 p-2 text-muted-foreground transition-colors hover:bg-card"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>

      <MarketWeatherWidget 
        weather={marketDashboard?.weather} 
        isLoading={isLoading} 
        isError={isError} 
      />

      <div className="mt-6">
        <MarketIndexSection />
      </div>

      <Section
        title="오늘의 주목 섹터"
        subtitle="강한 온도 변화가 생긴 업종을 먼저 골라볼 수 있게 구성했습니다."
        icon={TrendingUp}
      >
        <SectorRankingSection onSectorClick={setSelectedSector} />
      </Section>

      <StockSupplyRankingSection />

      <StockSupplyRankingSection direction="SELL" />

      <Section
        title="신규 상장"
        subtitle="정원에 새로 들어온 종목을 업종 맥락과 함께 확인합니다."
        icon={Sprout}
      >
        <NewListingsSection />
      </Section>

      {!isLoading && !isError && !marketDashboard?.indexes?.length && (
        <div className="page-shell page-content">
          <GardenEmptyState
            title="오늘의 시장 데이터를 준비하고 있어요"
            description="잠시 후 다시 확인하면 시장 현황과 수급 흐름을 함께 볼 수 있습니다."
            actionLabel="검색으로 이동"
            onAction={() => navigate("/search")}
          />
        </div>
      )}

      <SectorBottomSheet sector={selectedSector} onClose={() => setSelectedSector(null)} />
    </div>
  );
}
