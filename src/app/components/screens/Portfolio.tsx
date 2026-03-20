import { Link, useNavigate } from "react-router";
import { Activity, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/app/components/ui";
import { PageHeader, StockLogo } from "@/app/components/shared";
import { formatCurrency } from "@/utils/format";
import { PortfolioItemResponse } from "@/types/api";
import { toast } from "sonner";

export function Portfolio() {
  const navigate = useNavigate();
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);
  const { valuation, isLoading, health, holdings } = usePortfolio();
  const [isCreating, setIsCreating] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = async () => {
    const name = portfolioName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const newId = await portfolioApi.create({ name, description: "", items: [] });
      setPortfolioId(String(newId));
      setShowCreateModal(false);
      toast.success("포트폴리오가 생성되었습니다.");
    } catch {
      toast.error("포트폴리오 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!portfolioId) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-6xl mb-6">📊</div>
        <div className="text-foreground font-bold text-2xl mb-2 text-center">
          포트폴리오를 만들어보세요
        </div>
        <div className="text-muted-foreground text-center mb-10 font-medium">
          나만의 포트폴리오를 구성하고<br />건강 진단부터 백테스트까지 활용해보세요.
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-lg"
        >
          <Plus className="w-5 h-5" />
          포트폴리오 만들기
        </button>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="bg-card w-full rounded-t-3xl p-6">
              <div className="text-foreground font-bold text-xl mb-6">포트폴리오 이름</div>
              <input
                autoFocus
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="예) 내 첫 포트폴리오"
                className="w-full bg-secondary rounded-2xl px-5 py-4 text-foreground outline-none mb-4"
                style={{ fontSize: "16px" }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-secondary text-foreground font-bold"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !portfolioName.trim()}
                  className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
                >
                  {isCreating ? "생성 중..." : "만들기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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

        {holdings && (holdings.items?.length ?? 0) > 0 ? (
          <HoldingsList holdings={holdings.items ?? []} />
        ) : (
          <div className="bg-card rounded-3xl p-8 text-center shadow-sm border border-border">
            <div className="text-muted-foreground mb-2">아직 보유한 주식이 없어요.</div>
            <Link to="/search" className="text-primary font-bold hover:underline">
              주식 추가하러 가기
            </Link>
          </div>
        )}
        
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
        ₩ {formatCurrency(totalValue)}
      </div>
      <div className={`inline-flex items-center gap-2 ${isPositive ? "bg-up/10" : "bg-down/10"} px-6 py-2 rounded-full`}>
        <span className={`${isPositive ? "text-up" : "text-down"} font-bold text-xl`}>
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

function HoldingsList({ holdings }: { holdings: PortfolioItemResponse[] }) {
  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
      {holdings.map((stock, index: number) => (
        <Link key={stock.symbol} to={`/stock/${stock.symbol}`}>
          <motion.div
            whileTap={{ backgroundColor: "var(--color-secondary)" }}
            className={`px-6 py-5 flex items-center justify-between active:bg-accent transition-colors ${index !== holdings.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-4">
              <StockLogo name={stock.symbol} />
              <div>
                <div className="text-foreground font-bold">{stock.symbol}</div>
                <div className="text-muted-foreground text-xs font-medium">{stock.quantity}주</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-foreground font-bold">₩{formatCurrency(stock.purchasePrice)}</div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
