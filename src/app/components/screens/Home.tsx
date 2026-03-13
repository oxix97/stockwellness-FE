import { Link } from "react-router";
import { TrendingUp, Flame } from "lucide-react";
import { motion } from "motion/react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useStock } from "@/hooks/use-stock";
import { Skeleton } from "@/app/components/ui";
import { PageHeader, Section } from "@/app/components/shared";

const SECTORS = [
  { id: 1, icon: "💊", name: "바이오", status: "저평가 국면, 진입하기 좋은 타이밍", badge: "AI 의견" },
  { id: 2, icon: "⚡", name: "반도체", status: "단기 과열 주의", badge: "AI 의견" },
  { id: 3, icon: "🚗", name: "전기차", status: "장기 성장세 유지 중", badge: "AI 의견" },
];

export function Home() {
  const { valuation, isLoading: isValuationLoading } = usePortfolio();
  const { popular } = useStock();

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

      <AssetSummaryCard valuation={valuation} isLoading={isValuationLoading} />
      
      <Section title="지금 AI 어드바이저가 주목하는 섹터" icon={Flame}>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {SECTORS.map((sector, index) => (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <SectorCard sector={sector} />
            </motion.div>
          ))}
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
                ₩ {totalValue.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <span className={`${dailyGain >= 0 ? "text-[#FF4756]" : "text-blue-600"} font-bold text-lg`}>
                  오늘 {dailyGain >= 0 ? "+" : ""}₩ {Math.abs(dailyGain).toLocaleString()}
                </span>
                <span className={`${dailyGain >= 0 ? "text-[#FF4756]" : "text-blue-600"} font-bold text-lg`}>
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
  return (
    <div className="bg-card rounded-3xl p-5 min-w-[280px] shadow-sm border border-border">
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{sector.icon}</div>
        <span className="bg-accent text-primary px-3 py-1 rounded-full text-xs font-bold">
          {sector.badge}
        </span>
      </div>
      <div className="text-foreground mb-2 font-bold text-xl">{sector.name}</div>
      <div className="text-muted-foreground text-sm">{sector.status}</div>
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
