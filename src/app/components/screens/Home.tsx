import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Flame, TrendingUp, BarChart2, Zap, Bell } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useStock } from "@/hooks/use-stock";
import { useSector } from "@/hooks/use-sector";
import { Skeleton } from "@/app/components/ui";
import { Section } from "@/app/components/shared";
import { formatCurrency, formatPercent } from "@/utils/format";
import { MarketIndexSection } from "@/app/components/home/MarketIndexCard";
import { SectorBottomSheet } from "@/app/components/home/SectorBottomSheet";
import { SupplyDemandSection } from "@/app/components/home/SupplyDemandSection";
import { NewListingsSection } from "@/app/components/home/NewListingsSection";

const getSectorIcon = (name: string) => {
  if (name.includes("바이오") || name.includes("제약")) return "💊";
  if (name.includes("반도체") || name.includes("전기전자")) return "⚡";
  if (name.includes("전기차") || name.includes("자동차")) return "🚗";
  if (name.includes("금융") || name.includes("은행")) return "🏦";
  if (name.includes("조선") || name.includes("해운")) return "🚢";
  if (name.includes("철강") || name.includes("에너지")) return "🔥";
  return "📈";
};

export function Home() {
  const navigate = useNavigate();
  const { valuation, isLoading: isValuationLoading } = usePortfolio();
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const nickname = useAuthStore((state) => state.nickname);
  const { popular } = useStock();
  const { data: sectors, isLoading: isSectorsLoading } = useSector();

  // 섹터 바텀시트 상태
  const [selectedSector, setSelectedSector] = useState<(typeof sectors)[number] | null>(null);

  return (
    <div className="min-h-full pb-6">
      {/* 헤더 — 알림 벨 + LIVE 배지 */}
      <header className="px-4 py-3 flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-foreground font-bold text-2xl leading-snug"
        >
          {nickname ?? "투자자"}님,<br />오늘의 증시는 맑음이에요 ☀️
        </motion.p>
        <div className="flex items-center gap-3 shrink-0 self-start mt-1">
          {/* LIVE 배지 */}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF4756]/10 border border-[#FF4756]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4756] animate-pulse" />
            <span className="text-[#FF4756] text-[11px] font-bold">LIVE</span>
          </span>
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
        <MarketIndexSection />
      </Section>

      {/* 포트폴리오 수익률 요약 (포트폴리오 있을 때만) */}
      {portfolioId && (
        <div className="px-4 mb-2">
          <AssetSummaryCard valuation={valuation} isLoading={isValuationLoading} />
        </div>
      )}

      {/* 섹터 트렌드 캐러셀 */}
      <Section title="AI가 주목하는 섹터" icon={Flame}>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {isSectorsLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="min-w-[240px]">
                  <Skeleton className="h-[140px] w-full rounded-2xl" />
                </div>
              ))
            : sectors?.map((sector, index) => (
                <motion.div
                  key={sector.sectorCode}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className="min-w-[240px]"
                >
                  <SectorCard
                    sector={sector}
                    onTap={() => setSelectedSector(sector)}
                  />
                </motion.div>
              ))}
        </div>
      </Section>

      {/* 수급 상위 섹터 */}
      <Section title="기관·외국인 수급 상위" icon={Zap}>
        <SupplyDemandSection />
      </Section>

      {/* 신규 상장 */}
      <Section title="신규 상장" icon={TrendingUp}>
        <NewListingsSection />
      </Section>

      {/* 인기 검색 */}
      <Section title="실시간 인기 검색" icon={TrendingUp}>
        <TrendingList stocks={popular.data} isLoading={popular.isLoading} />
      </Section>

      {/* 섹터 바텀시트 */}
      <SectorBottomSheet
        sector={selectedSector}
        onClose={() => setSelectedSector(null)}
      />
    </div>
  );
}

function AssetSummaryCard({ valuation, isLoading }: any) {
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
              className="font-bold text-3xl tabular-nums"
              style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}
            >
              {isUp ? "+" : ""}
              {totalReturn.toFixed(2)}%
            </div>
            <div
              className="text-sm font-medium tabular-nums"
              style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}
            >
              {isUp ? "+" : "-"}₩{formatCurrency(Math.abs(totalProfitLoss))}
            </div>
          </>
        )}
      </motion.div>
    </Link>
  );
}

function SectorCard({ sector, onTap }: { sector: any; onTap: () => void }) {
  const isUp = sector.fluctuationRate >= 0;

  return (
    <button
      onClick={onTap}
      className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border flex flex-col justify-between h-[140px] text-left"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{getSectorIcon(sector.sectorName)}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            sector.isOverheated
              ? "bg-red-100 text-red-600"
              : "bg-primary/10 text-primary"
          }`}
        >
          {sector.isOverheated ? "⚠️ 과열" : "AI 추천"}
        </span>
      </div>
      <div>
        <p className="text-foreground font-bold text-base">{sector.sectorName}</p>
        <p
          className="text-sm font-semibold tabular-nums"
          style={{ color: isUp ? "#2EBE7A" : "#EF4444" }}
        >
          {formatPercent(sector.fluctuationRate)}
        </p>
      </div>
    </button>
  );
}

function TrendingList({ stocks, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {stocks?.map((name: string, index: number) => (
        <Link key={name} to={`/stock/${encodeURIComponent(name)}`}>
          <motion.div
            whileTap={{ backgroundColor: "var(--color-secondary)" }}
            className={`flex items-center justify-between py-3.5 px-4 ${
              index !== stocks.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-sm w-5">{index + 1}</span>
              <span className="text-foreground font-medium text-sm">{name}</span>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground opacity-40" />
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
