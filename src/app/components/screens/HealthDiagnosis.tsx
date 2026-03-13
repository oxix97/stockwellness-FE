import { useNavigate } from "react-router";
import { FlaskConical, Activity } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Skeleton } from "@/app/components/ui";
import { PageHeader } from "@/app/components/shared";

export function HealthDiagnosis() {
  const navigate = useNavigate();
  const { health, advice, isLoading } = usePortfolio();

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

      <PrescriptionSection advice={advice} onBacktest={() => navigate("/backtest/setup")} />
    </div>
  );
}

function ScoreCard({ score, adviceContent }: { score: number; adviceContent?: string }) {
  return (
    <div className="px-6 py-10 bg-card border-b border-border text-center">
      <div className="text-6xl mb-4">🩺</div>
      <div className="text-muted-foreground mb-2 font-medium">종합 건강 점수</div>
      <div className="text-primary mb-6 font-bold text-6xl">
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

function RadarSection({ data }: { data: any[] }) {
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

function PrescriptionSection({ advice, onBacktest }: any) {
  return (
    <div className="px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="text-4xl">💊</div>
        <div className="text-foreground font-bold text-2xl">AI의 처방전</div>
      </div>
      
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
         <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-primary" />
            <div className="text-foreground font-bold text-lg">권장 조치: {advice?.action}</div>
         </div>
         <div className="text-foreground leading-relaxed mb-6 font-medium">
           {advice?.content}
         </div>
         <div className="text-xs text-muted-foreground bg-secondary/50 inline-block px-3 py-1 rounded-full">
           생성일: {new Date(advice?.createdAt).toLocaleString()}
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
