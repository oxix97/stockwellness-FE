import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/app/components/ui";
import { usePortfolioSummary } from "@/hooks/use-portfolio";
import { AssetRatio } from "@/types/api";

const CHART_COLORS = [
  "#2EBE7A",
  "#1A56DB",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#6B7280",
];

export function DiversificationWidget() {
  const { diversification, isLoading } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[200px] w-full rounded-2xl" />
      </div>
    );
  }

  const assetData = diversification?.assetRatios ?? [];
  const sectorData = diversification?.sectorRatios ?? [];
  const countryData = diversification?.countryRatios ?? [];

  const renderPieChart = (title: string, data: AssetRatio[]) => {
    if (data.length === 0) return null;
    return (
      <div className="bg-card rounded-2xl p-4 border border-border">
        <p className="text-foreground font-semibold text-sm mb-4">{title}</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, "비중"]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      {renderPieChart("자산군 비중", assetData)}
      {renderPieChart("섹터 비중", sectorData)}
      {renderPieChart("국가별 비중", countryData)}
    </div>
  );
}
