import { useState } from "react";
import { Activity, ChevronDown, PieChart, RefreshCcw, Settings, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/app/components/ui";
import { formatCurrency, formatPercent } from "@/utils/format";
import { calculateHealthBadge } from "@/utils/calculate";
import { PortfolioWizard } from "@/app/components/portfolio/wizard/PortfolioWizard";
import { PortfolioBottomSheet, AnalysisType } from "@/app/components/portfolio/PortfolioBottomSheet";
import { PortfolioEditSheet } from "@/app/components/portfolio/PortfolioEditSheet";
import { PortfolioHoldingsSheet } from "@/app/components/portfolio/PortfolioHoldingsSheet";

/**
 * Task #80 ~ #83 — 포트폴리오 메인 뷰 (모달/바텀시트 중심 UX)
 */
export function Portfolio() {
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const { valuation, isLoading, health, holdings } = usePortfolio();
  const [showWizard, setShowWizard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHoldings, setShowHoldings] = useState(false);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);

  // ── 빈 상태 ────────────────────────────────────────────
  if (!portfolioId) {
    return (
      <>
        <div className="min-h-full flex flex-col items-center justify-center px-6 pb-20 text-center">
          <div className="text-6xl mb-6">📊</div>
          <p className="text-foreground font-bold text-xl mb-2">
            나만의 자산 배분 포트폴리오를<br />만들어보세요
          </p>
          <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
            백테스트와 AI 분석으로<br />내 전략의 과거 성과를 확인하세요
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold"
          >
            📊 포트폴리오 만들기
          </button>
        </div>
        {showWizard && <PortfolioWizard onClose={() => setShowWizard(false)} />}
      </>
    );
  }

  // ── 로딩 ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // ── AI 건강 뱃지 ──────────────────────────────────────
  const score = health.overallScore;
  const healthBadge = calculateHealthBadge(score);

  return (
    <div className="min-h-full pb-10">
      {/* 요약부 */}
      <div className="px-4 pt-4 pb-6 bg-card border-b border-border">
        {/* 스위처 */}
        <div className="flex items-center justify-between mb-3">
          <button className="flex items-center gap-1">
            <span className="text-foreground font-semibold text-sm">내 포트폴리오</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <button 
            onClick={() => setShowEdit(true)}
            className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 총 자산 */}
        <p className="text-muted-foreground text-xs mb-0.5">총 자산</p>
        <p className="text-foreground font-bold text-[28px] tabular-nums mb-1">
          ₩{formatCurrency(valuation?.currentTotalValue ?? 0)}
        </p>

        {/* 수익 */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className={`text-sm font-semibold tabular-nums ${(valuation?.totalReturnRate ?? 0) >= 0 ? "text-up" : "text-down"}`}
          >
            {`${(valuation?.totalProfitLoss ?? 0) >= 0 ? "+" : "-"}₩${formatCurrency(Math.abs(valuation?.totalProfitLoss ?? 0))} ${formatPercent(valuation?.totalReturnRate ?? 0)} 누적`}
          </span>
          <span className="text-muted-foreground text-xs">|</span>
          <span
            className={`text-xs tabular-nums ${(valuation?.dailyReturnRate ?? 0) >= 0 ? "text-up" : "text-down"}`}
          >
            {`오늘 ${(valuation?.dailyProfitLoss ?? 0) >= 0 ? "+" : "-"}₩${formatCurrency(Math.abs(valuation?.dailyProfitLoss ?? 0))} ${formatPercent(valuation?.dailyReturnRate ?? 0)}`}
          </span>
        </div>

        {/* 지표 + 건강 뱃지 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Sharpe{" "}
            <span className="text-foreground font-semibold tabular-nums">
              {(valuation?.sharpeRatio ?? 0).toFixed(2)}
            </span>
          </span>
          <span className="text-muted-foreground text-xs">|</span>
          <span className="text-xs text-muted-foreground">
            MDD{" "}
            <span className="text-foreground font-semibold tabular-nums">
              {(valuation?.mdd ?? 0).toFixed(1)}%
            </span>
          </span>
          <span
            className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full ${healthBadge.color}`}
          >
            {healthBadge.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 분석 퀵 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setAnalysisType("diversification")}
            className="p-4 bg-card rounded-2xl border border-border flex flex-col items-start gap-2 text-left"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <PieChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">분산도 분석</p>
              <p className="text-muted-foreground text-[10px]">자산/섹터 비중</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setAnalysisType("rebalancing")}
            className="p-4 bg-card rounded-2xl border border-border flex flex-col items-start gap-2 text-left"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <RefreshCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">리밸런싱</p>
              <p className="text-muted-foreground text-[10px]">목표 비중 최적화</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setAnalysisType("backtest")}
            className="p-4 bg-card rounded-2xl border border-border flex flex-col items-start gap-2 text-left"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">시뮬레이션</p>
              <p className="text-muted-foreground text-[10px]">과거 수익률 비교</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setAnalysisType("correlation")}
            className="p-4 bg-card rounded-2xl border border-border flex flex-col items-start gap-2 text-left"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">상관관계</p>
              <p className="text-muted-foreground text-[10px]">종목 간 위험 분산</p>
            </div>
          </motion.button>
        </div>

        {/* 보유 종목 요약 */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <p className="text-foreground font-bold text-sm">보유 종목</p>
            <p className="text-muted-foreground text-xs">
              {holdings?.items?.length ?? 0}개
            </p>
          </div>
          <div className="divide-y divide-border">
            {holdings?.items?.slice(0, 5).map((item: any) => (
              <div
                key={item.symbol}
                className="px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-foreground font-semibold text-sm">
                    {item.name || item.symbol}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.symbol} · {item.quantity}주
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-semibold text-sm tabular-nums">
                    ₩{formatCurrency(item.currentValue ?? 0)}
                  </p>
                  <p
                    className={`text-xs tabular-nums ${
                      (item.returnRate ?? 0) >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {formatPercent(item.returnRate ?? 0)}
                  </p>
                </div>
              </div>
            ))}
            {(holdings?.items?.length ?? 0) > 5 && (
              <button 
                onClick={() => setShowHoldings(true)}
                className="w-full py-3 text-center text-muted-foreground text-xs hover:bg-muted/30 transition-colors"
              >
                전체 종목 보기 ({holdings?.items?.length}) →
              </button>
            )}
            {(holdings?.items?.length ?? 0) === 0 && (
              <div className="py-10 text-center text-muted-foreground text-sm">
                보유 종목이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <PortfolioBottomSheet
        isOpen={analysisType !== null}
        onClose={() => setAnalysisType(null)}
        type={analysisType}
      />

      {showEdit && (
        <PortfolioEditSheet 
          isOpen={showEdit} 
          onClose={() => setShowEdit(false)} 
        />
      )}

      {showHoldings && (
        <PortfolioHoldingsSheet 
          isOpen={showHoldings} 
          onClose={() => setShowHoldings(false)} 
        />
      )}

      {showWizard && <PortfolioWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}

