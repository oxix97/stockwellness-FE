import { Link } from "react-router";
import { TrendingUp, Flame } from "lucide-react";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useStock } from "@/hooks/use-stock";
import { useSector } from "@/hooks/use-sector";
import { Skeleton } from "@/app/components/ui";
import { PageHeader, Section } from "@/app/components/shared";
import { formatCurrency } from "@/utils/format";

/**
 * 섹터 이름에 따른 적절한 이모지를 반환합니다.
 */
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
  const { valuation, isLoading: isValuationLoading } = usePortfolio();
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const { popular } = useStock();
  const { data: sectors, isLoading: isSectorsLoading } = useSector();

  return (
    <div className="min-h-full pb-20">
      <PageHeader logo showNotifications />
      
      <div className="px-6 py-4">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="text-foreground font-bold text-3xl leading-tight"
         >
           투자자님,<br />오늘의 증시는 맑음이에요 ☀️
         </motion.div>
      </div>

      {portfolioId && (
        <AssetSummaryCard valuation={valuation} isLoading={isValuationLoading} />
      )}
      
      <Section title="지금 AI 어드바이저가 주목하는 섹터" icon={Flame}>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {isSectorsLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="min-w-[280px]">
                <Skeleton className="h-[160px] w-full rounded-3xl" />
              </div>
            ))
          ) : sectors && sectors.length > 0 ? (
            sectors.map((sector, index) => (
              <motion.div
                key={sector.sectorCode}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <SectorCard sector={sector} />
              </motion.div>
            ))
          ) : (
            <div className="text-muted-foreground text-sm py-4">추천 섹터 정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </Section>

      <Section title="실시간 인기 검색" icon={TrendingUp}>
        <TrendingList stocks={popular.data} isLoading={popular.isLoading} />
      </Section>
    </div>
  );
}

function AssetSummaryCard({ valuation, isLoading }: any) {
  const totalValue = valuation?.currentTotalValue ?? 0;
  const dailyGain = valuation?.dailyProfitLoss ?? 0;
  const dailyReturn = valuation?.dailyReturnRate ?? 0;

  return (
    <div className="px-6 py-6">
      <Link to="/portfolio">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          whileHover={{ y: -2 }}
          className="bg-card rounded-3xl p-6 shadow-sm border border-border transition-all"
        >
          <div className="text-muted-foreground mb-2 font-medium">현재 내 자산</div>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
          ) : (
            <>
              <div className="text-foreground mb-3 font-bold text-4xl">
                ₩ {formatCurrency(totalValue)}
              </div>
              <div className="flex items-center gap-2">
                <span className={`${dailyGain >= 0 ? "text-up" : "text-down"} font-bold text-lg`}>
                  오늘 {dailyGain >= 0 ? "+" : ""}₩ {formatCurrency(Math.abs(dailyGain))}
                </span>
                <span className={`${dailyGain >= 0 ? "text-up" : "text-down"} font-bold text-lg`}>
                  ({dailyReturn}% {dailyGain >= 0 ? "🔺" : "🔻"})
                </span>
              </div>
            </>
          )}
        </motion.div>
      </Link>
    </div>
  );
}

function SectorCard({ sector }: any) {
  const isUp = sector.fluctuationRate >= 0;
  
  return (
    <div className="bg-card rounded-3xl p-5 min-w-[280px] shadow-sm border border-border h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="text-4xl">{getSectorIcon(sector.sectorName)}</div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${sector.isOverheated ? "bg-red-100 text-red-600" : "bg-accent text-primary"}`}>
            {sector.isOverheated ? "⚠️ 과열 주의" : "AI 추천"}
          </span>
        </div>
        <div className="text-foreground mb-1 font-bold text-xl">{sector.sectorName}</div>
        <div className={`text-sm font-semibold mb-3 ${isUp ? "text-up" : "text-down"}`}>
          {isUp ? "+" : ""}{sector.fluctuationRate}% {isUp ? "🔺" : "🔻"}
        </div>
      </div>
      <div className="text-muted-foreground text-xs line-clamp-2 bg-secondary/30 p-2 rounded-xl">
        {sector.diagnosisMessage || "현재 섹터에 대한 AI 진단 결과를 분석 중입니다."}
      </div>
    </div>
  );
}

function TrendingList({ stocks, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl p-6 border border-border space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border overflow-hidden">
      {stocks?.map((name: string, index: number) => (
        <Link key={name} to={`/search?keyword=${name}`}>
          <motion.div 
            whileTap={{ backgroundColor: "var(--color-secondary)" }}
            className={`flex items-center justify-between py-4 px-2 -mx-2 rounded-xl transition-colors ${index !== stocks.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-primary font-bold text-lg min-w-[24px]">{index + 1}</span>
              <span className="text-foreground font-semibold">{name}</span>
            </div>
            <TrendingUp className="w-5 h-5 text-muted-foreground opacity-50" />
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
