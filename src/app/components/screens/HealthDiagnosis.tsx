import { useNavigate } from "react-router";
import { FlaskConical, Activity } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Skeleton } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";
import { CorrelationMatrix, AdviceResponse } from "@/types/api";

export function HealthDiagnosis() {
  const navigate = useNavigate();
  const { health, advice, correlation, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PageHeader title="포트폴리오 건강 검진" showBack />

      <ScoreCard score={health.overallScore} adviceContent={advice?.content} />

      <RadarSection data={health.radarData} />

      {correlation && <CorrelationSection matrix={correlation} />}

      <PrescriptionSection advice={advice} onBacktest={() => navigate("/backtest/setup")} />
    </div>
  );
}

function ScoreCard({ score, adviceContent }: { score: number; adviceContent?: string }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-[#2EBE7A]"; // 건강 (초록)
    if (s >= 50) return "text-[#F5A623]"; // 주의 (주황)
    return "text-[#FF4756]"; // 위험 (빨강)
  };

  return (
    <div className="px-6 py-10 bg-card border-b border-border text-center">
      <div className="text-6xl mb-4">🩺</div>
      <div className="text-muted-foreground mb-2 font-medium">종합 건강 점수</div>
      <div className={`mb-6 font-bold text-6xl ${getScoreColor(score)}`}>
        {score}점
      </div>
      <div className="bg-accent rounded-3xl p-5 max-w-md mx-auto border border-primary/10">
        <div className="flex items-start gap-4 text-left">
          <div className="text-3xl">💬</div>
          <div className="text-foreground leading-relaxed font-medium">
            {adviceContent || "데이터를 분석 중입니다..."}
          </div>
        </div>
      </div>
    </div>
  );
}

function RadarSection({ data }: { data: { metric: string; value: number }[] }) {
  return (
    <div className="px-6 py-10 bg-card border-b border-border">
      <div className="text-foreground mb-8 text-center font-bold text-xl">
        건강 레이더 차트
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }}
            />
            <Radar
              dataKey="value"
              stroke="#2EBE7A"
              fill="#2EBE7A"
              fillOpacity={0.3}
              strokeWidth={3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CorrelationSection({ matrix }: { matrix: CorrelationMatrix }) {
  const tickers = Object.keys(matrix);

  const getColor = (value: number) => {
    if (value >= 0.7) return "bg-[#FF4756] text-white";
    if (value >= 0.3) return "bg-[#FF4756]/40 text-foreground";
    if (value >= -0.3) return "bg-secondary text-foreground";
    if (value >= -0.7) return "bg-[#3182F6]/40 text-foreground";
    return "bg-[#3182F6] text-white";
  };

  return (
    <div className="px-6 py-10 bg-card border-b border-border">
      <div className="text-foreground mb-2 font-bold text-xl">종목 간 상관관계</div>
      <div className="text-muted-foreground text-sm mb-6">
        빨간색일수록 양의 상관, 파란색일수록 음의 상관을 나타냅니다.
      </div>
      {/* 스크롤 힌트: 우측 페이드 */}
      <div className="relative">
        <div className="overflow-x-auto">
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `64px repeat(${tickers.length}, 56px)` }}>
            {/* 헤더 행 */}
            <div />
            {tickers.map((ticker) => (
              <div key={ticker} className="text-center text-xs font-bold text-muted-foreground truncate px-1">
                {ticker}
              </div>
            ))}
            {/* 데이터 행 — 하삼각형만 표시 (대각선 포함) */}
            {tickers.map((rowTicker, rowIdx) => (
              <>
                <div key={rowTicker} className="text-xs font-bold text-muted-foreground flex items-center truncate">
                  {rowTicker}
                </div>
                {tickers.map((colTicker, colIdx) => {
                  // 대각선: 항상 1.0 — 별도 스타일
                  if (rowIdx === colIdx) {
                    return (
                      <div
                        key={colTicker}
                        className="h-14 rounded-lg flex items-center justify-center text-xs font-bold bg-primary/10 text-primary"
                      >
                        1.00
                      </div>
                    );
                  }
                  // 상삼각형: 빈 셀로 처리 (대칭이므로 생략)
                  if (colIdx > rowIdx) {
                    return <div key={colTicker} className="h-14" />;
                  }
                  const value = matrix[rowTicker]?.[colTicker] ?? 0;
                  return (
                    <div
                      key={colTicker}
                      className={`h-14 rounded-lg flex items-center justify-center text-xs font-bold ${getColor(value)}`}
                    >
                      {value.toFixed(2)}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
        {/* 우측 페이드 스크롤 힌트 */}
        <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-card to-transparent" />
      </div>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  REBALANCE: "리밸런싱",
  RISK_MANAGEMENT: "리스크 관리",
  TECHNICAL_OPTIMIZATION: "기술적 최적화",
  DIVERSIFICATION: "포트폴리오 다각화",
};

function ActionBadge({ action }: { action?: string }) {
  if (!action) return null;
  const label = ACTION_LABEL[action] ?? action;

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border bg-primary/10 text-primary border-primary/20">
      {label}
    </span>
  );
}

function PrescriptionSection({ advice, onBacktest }: { advice: AdviceResponse | undefined; onBacktest: () => void }) {
  return (
    <div className="px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-4xl">💊</div>
        <div className="text-foreground font-bold text-2xl">AI의 처방전</div>
      </div>

      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <div className="text-foreground font-bold text-base">권장 조치</div>
          </div>
          <ActionBadge action={advice?.action} />
        </div>
        <div className="text-foreground leading-relaxed mb-6 font-medium">
          {advice?.content}
        </div>
        <div className="text-xs text-muted-foreground bg-secondary/50 inline-block px-3 py-1 rounded-full">
          생성일: {advice?.createdAt ? new Date(advice.createdAt).toLocaleString() : "-"}
        </div>
      </div>

      <button
        onClick={onBacktest}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-xl font-bold shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
      >
        <FlaskConical className="w-6 h-6" />
        이대로 과거 1년 백테스트 돌려보기
      </button>
    </div>
  );
}
