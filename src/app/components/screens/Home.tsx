import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { TrendingUp, BarChart2, Zap, Bell } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth";
import { usePortfolioValuation } from "@/hooks/use-portfolio";
import { useMarketIndex } from "@/hooks/use-market-index";
import { Skeleton } from "@/app/components/ui";
import { PortfolioValuationResponse } from "@/types/api";
import { Section } from "@/app/components/shared";
import { formatCurrency } from "@/utils/format";
import { MarketIndexSection } from "@/app/components/home/MarketIndexCard";
import { SupplyDemandSection } from "@/app/components/home/SupplyDemandSection";
import { SectorRankingSection } from "@/app/components/home/SectorRankingSection";
import { NewListingsSection } from "@/app/components/home/NewListingsSection";
import { SectorBottomSheet, SectorData } from "@/app/components/home/SectorBottomSheet";

function getMarketGreeting(kospiRate: number | null): { text: string; emoji: string } {
  if (kospiRate == null) return { text: "오늘의 증시를 불러오는 중이에요", emoji: "📊" };
  if (kospiRate >= 0.5) return { text: "오늘의 증시는 맑음이에요", emoji: "☀️" };
  if (kospiRate <= -0.5) return { text: "오늘의 증시는 비가 내려요", emoji: "🌧️" };
  return { text: "오늘의 증시는 흐림이에요", emoji: "⛅" };
}

export function Home() {
  const navigate = useNavigate();
  const { data: valuation, isLoading: isValuationLoading } = usePortfolioValuation();
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const nickname = useAuthStore((state) => state.nickname);
  const { data: marketIndexes } = useMarketIndex();
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

  // KOSPI 등락률 기반 인사말
  const kospiRate = marketIndexes?.find((m) => m.ticker === "0001")?.fluctuationRate ?? null;
  const greeting = getMarketGreeting(kospiRate);

  return (
    <div className="min-h-full pb-6">
      {/* 헤더 — 알림 벨 */}
      <header className="px-4 py-3 flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-foreground font-bold text-2xl leading-snug"
        >
          {nickname ?? "투자자"}님,<br />{greeting.text} {greeting.emoji}
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

      {/* 포트폴리오 수익률 요약 (포트폴리오 있을 때만) */}
      {portfolioId && (
        <div className="px-4 mb-2">
          <AssetSummaryCard valuation={valuation} isLoading={isValuationLoading} />
        </div>
      )}

      {/* 수급 상위 섹터 */}
      <Section title="기관·외국인 수급 상위" icon={Zap}>
        <SupplyDemandSection onSectorClick={setSelectedSector} />
      </Section>

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

function AssetSummaryCard({ valuation, isLoading }: { valuation: PortfolioValuationResponse | undefined; isLoading: boolean }) {
  const totalReturn = valuation?.totalReturnRate ?? 0;
  const totalProfitLoss = valuation?.totalProfitLoss ?? 0;
  const isUp = totalReturn >= 0;

  return (
    <Link to="/portfolio">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border"
      >
        <div className="text-muted-foreground text-xs mb-1 font-medium">내 포트폴리오 수익률</div>
        {isLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-24" />
          </div>
        ) : (
          <>
            <div
              className={`font-bold text-3xl tabular-nums ${isUp ? "text-up" : "text-down"}`}
            >
              {isUp ? "+" : ""}
              {totalReturn.toFixed(2)}%
            </div>
            <div
              className={`text-sm font-medium tabular-nums ${isUp ? "text-up" : "text-down"}`}
            >
              {isUp ? "+" : "-"}₩{formatCurrency(Math.abs(totalProfitLoss))}
            </div>
          </>
        )}
      </motion.div>
    </Link>
  );
}
