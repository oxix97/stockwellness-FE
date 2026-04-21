import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BarChart2, Sprout, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/app/components/ui";
import { ContextHeader, GardenEmptyState, Section } from "@/app/components/shared";
import { useAuthStore } from "@/store/auth";
import { useMarketIndex } from "@/hooks/use-market-index";
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
      <div className="page-shell page-content pt-4 md:pt-6">
        <ContextHeader
          variant="market"
          layout="split"
          title={
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="max-w-[15rem] text-[length:var(--mobile-hero-title-size)] font-bold leading-[1.08] tracking-tight min-[408px]:max-w-[17rem] md:max-w-[24rem] md:text-[32px]">
                {nickname ?? "투자자"}님,
                <br />
                {greeting.text} {greeting.emoji}
              </p>
            </motion.div>
          }
          description="오늘 시장 요약을 빠르게 확인하고 다음 탐색을 시작할 수 있도록 정리했습니다."
          actions={
            <div className="relative z-20">
              <button
                onClick={() => navigate("/more/notifications")}
                className="rounded-full border border-border/70 bg-card/80 p-2 text-muted-foreground transition-colors hover:bg-card"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
          }
        />
      </div>

      <Section
        title="시장 현황"
        subtitle="대표 지수 흐름을 먼저 확인하고 오늘의 투자 감도를 맞춥니다."
        icon={BarChart2}
        className="pt-6"
        rightContent={
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/search")}>
            시장 탐색
          </Button>
        }
      >
        <MarketIndexSection />
      </Section>

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
