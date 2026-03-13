import { Link, useNavigate } from "react-router";
import { Activity } from "lucide-react";
import { motion } from "motion/react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Skeleton } from "@/app/components/ui";
import { PageHeader, StockLogo } from "@/app/components/shared";

// UI 테스트를 위한 가상 보유 종목 데이터
const HOLDINGS = [
  { symbol: "005930", name: "삼성전자", shares: 10, currentPrice: 72000, avgPrice: 68000, return: 5.88, isUp: true },
  { symbol: "TSLA", name: "TESLA", shares: 5, currentPrice: 245.5, avgPrice: 230.0, return: 6.74, isUp: true },
  { symbol: "000660", name: "SK하이닉스", shares: 8, currentPrice: 158000, avgPrice: 162000, return: -2.47, isUp: false },
  { symbol: "035420", name: "NAVER", shares: 3, currentPrice: 182000, avgPrice: 175000, return: 4.0, isUp: true },
];

export function Portfolio() {
  const navigate = useNavigate();
  const { valuation, isLoading, health } = usePortfolio();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-20">
      <PageHeader title="내 주식" />

      <AssetOverview 
        totalValue={valuation?.currentTotalValue} 
        totalReturn={valuation?.totalReturnRate} 
      />

      <div className="px-6 py-6">
        <HealthDiagnosisBanner score={health.overallScore} />
        
        <div className="flex justify-between items-center mb-4 mt-8 px-2">
           <h2 className="text-xl font-bold text-foreground">보유 주식</h2>
           <button className="text-primary text-sm font-semibold">편집</button>
        </div>

        <HoldingsList holdings={HOLDINGS} />
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/backtest/setup")}
          className="w-full bg-card rounded-3xl p-5 mt-6 shadow-sm border border-border flex items-center justify-between hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">🧪</div>
            <div className="text-left">
              <div className="text-foreground font-bold">전략 백테스트</div>
              <div className="text-muted-foreground text-sm">내 전략의 과거 성과는?</div>
            </div>
          </div>
          <span className="text-primary text-2xl">→</span>
        </motion.button>
      </div>
    </div>
  );
}

function AssetOverview({ totalValue = 0, totalReturn = 0 }: any) {
  const isPositive = totalReturn >= 0;
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-10 bg-card border-b border-border text-center"
    >
      <div className="text-muted-foreground mb-3 font-medium">내 포트폴리오 총 평가금액</div>
      <div className="text-foreground mb-6 font-bold text-5xl">
        ₩ {totalValue.toLocaleString()}
      </div>
      <div className={`inline-flex items-center gap-2 ${isPositive ? "bg-[#FFE5E8]" : "bg-blue-100"} px-6 py-2 rounded-full`}>
        <span className={`${isPositive ? "text-[#FF4756]" : "text-blue-600"} font-bold text-xl`}>
          총 수익률 {isPositive ? "+" : ""}{totalReturn}%
        </span>
      </div>
    </motion.div>
  );
}

function HealthDiagnosisBanner({ score }: { score: number }) {
  return (
    <Link to="/health-diagnosis">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -2 }}
        className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] rounded-3xl p-6 shadow-sm border border-primary/20 transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-foreground font-bold text-xl">건강 진단</span>
            </div>
            <div className="text-foreground opacity-80 mb-1">내 포트폴리오 건강 점수는</div>
            <div className="text-primary font-bold text-4xl">{score}점</div>
            <div className="text-muted-foreground mt-4 text-sm font-medium">진단 리포트 보기 👉</div>
          </div>
          <div className="text-6xl">🩺</div>
        </div>
      </motion.div>
    </Link>
  );
}

function HoldingsList({ holdings }: any) {
  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
      {holdings.map((stock: any, index: number) => (
        <Link key={stock.symbol} to={`/stock/${stock.symbol}`}>
          <motion.div 
            whileTap={{ backgroundColor: "var(--color-secondary)" }}
            className={`px-6 py-5 flex items-center justify-between active:bg-accent transition-colors ${index !== holdings.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-4">
              <StockLogo name={stock.name} />
              <div>
                <div className="text-foreground font-bold">{stock.name}</div>
                <div className="text-muted-foreground text-xs font-medium">{stock.shares}주</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-foreground font-bold">₩{stock.currentPrice.toLocaleString()}</div>
              <div className={`text-xs font-bold ${stock.isUp ? "text-[#FF4756]" : "text-[#3182F6]"}`}>
                {stock.isUp ? "+" : ""}{stock.return}%
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
