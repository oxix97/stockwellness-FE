import { useState } from "react";
import { Link } from "react-router";
import { Activity, ChevronDown, FlaskConical } from "lucide-react";
import { motion } from "motion/react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useAuthStore } from "@/store/auth";
import { Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui";
import { formatCurrency, formatPercent } from "@/utils/format";
import { PortfolioWizard } from "@/app/components/portfolio/wizard/PortfolioWizard";
import { CompositionTab } from "@/app/components/portfolio/tabs/CompositionTab";
import { SimulationTab } from "@/app/components/portfolio/tabs/SimulationTab";
import { RebalancingTab } from "@/app/components/portfolio/tabs/RebalancingTab";

/**
 * Task #80 ~ #83 — 포트폴리오 탭 메인 뷰
 */
export function Portfolio() {
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const { valuation, isLoading, health } = usePortfolio();
  const [showWizard, setShowWizard] = useState(false);

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
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // ── AI 건강 뱃지 ──────────────────────────────────────
  const score = health.overallScore;
  const healthBadge =
    score >= 70
      ? { label: "✅ 안정적", color: "bg-green-50 text-green-700" }
      : score >= 40
      ? { label: "⚠️ 주의", color: "bg-amber-50 text-amber-700" }
      : { label: "🔴 위험", color: "bg-red-50 text-red-700" };

  return (
    <div className="min-h-full pb-6">
      {/* 요약부 — 즉시 렌더링 */}
      <div className="px-4 pt-4 pb-3 border-b border-border bg-card">
        {/* 스위처 */}
        <button className="flex items-center gap-1 mb-3">
          <span className="text-foreground font-semibold text-sm">내 포트폴리오</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* 총 자산 */}
        <p className="text-muted-foreground text-xs mb-0.5">총 자산</p>
        <p className="text-foreground font-bold text-[28px] tabular-nums mb-1">
          ₩{formatCurrency(valuation?.currentTotalValue ?? 0)}
        </p>

        {/* 수익 */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: (valuation?.totalReturnRate ?? 0) >= 0 ? "#2EBE7A" : "#EF4444" }}
          >
            {formatPercent(valuation?.totalReturnRate ?? 0)} 누적
          </span>
          <span className="text-muted-foreground text-xs">|</span>
          <span
            className="text-xs tabular-nums"
            style={{ color: (valuation?.dailyReturnRate ?? 0) >= 0 ? "#2EBE7A" : "#EF4444" }}
          >
            오늘 {formatPercent(valuation?.dailyReturnRate ?? 0)}
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

      {/* 건강 진단 배너 + 시뮬레이션 CTA — 탭 상단 고정 */}
      <div className="px-4 pt-3 pb-0 bg-background border-b border-border sticky top-0 z-10 space-y-2">
        <Link to="/health-diagnosis">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-3.5 border border-primary/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-foreground font-semibold text-sm">포트폴리오 건강 진단</p>
                <p className="text-muted-foreground text-xs">점수 {score}점 · 리포트 보기</p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${healthBadge.color}`}>
              {healthBadge.label}
            </span>
          </motion.div>
        </Link>
        <Link to="/backtest/setup">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-primary/5 rounded-2xl p-3.5 border border-primary/20 flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-3">
              <FlaskConical className="w-5 h-5 text-primary shrink-0" />
              <p className="text-foreground font-semibold text-sm">포트폴리오 시뮬레이션</p>
            </div>
            <span className="text-primary text-sm font-bold">시작 →</span>
          </motion.div>
        </Link>
      </div>

      {/* 3탭 */}
      <Tabs defaultValue="composition">
        <TabsList className="w-full rounded-none border-b border-border bg-card h-11 px-4 justify-start gap-4">
          <TabsTrigger value="composition" className="text-sm px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full">
            구성/비중
          </TabsTrigger>
          <TabsTrigger value="simulation" className="text-sm px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full">
            시뮬레이션
          </TabsTrigger>
          <TabsTrigger value="rebalancing" className="text-sm px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full">
            AI 리밸런싱
          </TabsTrigger>
        </TabsList>

        <TabsContent value="composition" className="mt-0">
          <CompositionTab />
        </TabsContent>
        <TabsContent value="simulation" className="mt-0">
          <SimulationTab />
        </TabsContent>
        <TabsContent value="rebalancing" className="mt-0">
          <RebalancingTab />
        </TabsContent>
      </Tabs>

    </div>
  );
}
