import React from "react";
import { usePortfolioCorrelation } from "@/hooks/use-portfolio";
import { Loader2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export function CorrelationWidget() {
  const { data: matrix, isLoading, isError } = usePortfolioCorrelation();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !matrix) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  const tickers = Object.keys(matrix);

  if (tickers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        상관관계 분석을 위한 종목이 부족합니다.
      </div>
    );
  }

  // 상관계수에 따른 색상 결정 함수
  const getCellColor = (value: number) => {
    // 자기 자신 (1.0) 또는 완벽한 상관관계
    if (value >= 0.95) return "bg-rose-600 text-rose-50";
    if (value >= 0.7) return "bg-rose-400 text-rose-50";
    if (value >= 0.3) return "bg-rose-100 text-rose-900";
    if (value >= -0.3) return "bg-slate-100 text-slate-500";
    if (value >= -0.7) return "bg-blue-100 text-blue-900";
    if (value >= -0.95) return "bg-blue-400 text-blue-50";
    return "bg-blue-600 text-blue-50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-lg font-semibold tracking-tight">종목 간 상관관계</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5 rounded-full hover:bg-muted">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] p-3 text-xs leading-relaxed">
                <p className="font-bold mb-1.5 border-b pb-1">상관관계 가이드</p>
                <ul className="space-y-1">
                  <li>• <span className="text-rose-600 font-semibold">0.7 이상</span>: 같이 움직이는 경향 (위험 집중)</li>
                  <li>• <span className="text-slate-600 font-semibold">-0.3 ~ 0.3</span>: 관계 없음 (분산 효과 탁월)</li>
                  <li>• <span className="text-blue-600 font-semibold">-0.7 이하</span>: 반대로 움직임 (상호 보완)</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
        <div 
          className="grid gap-1.5 min-w-max" 
          style={{ gridTemplateColumns: `80px repeat(${tickers.length}, 42px)` }}
        >
          {/* Header row */}
          <div className="h-10" />
          {tickers.map((ticker) => (
            <div key={ticker} className="flex h-10 w-10 items-end justify-center pb-1">
              <span className="text-[10px] font-bold text-muted-foreground/80 rotate-[-45deg] origin-bottom-left whitespace-nowrap pl-1">
                {ticker}
              </span>
            </div>
          ))}

          {/* Data rows */}
          {tickers.map((rowTicker) => (
            <React.Fragment key={rowTicker}>
              <div className="flex h-10 w-20 items-center">
                <span className="text-[11px] font-bold text-foreground truncate">
                  {rowTicker}
                </span>
              </div>
              {tickers.map((colTicker) => {
                const value = matrix[rowTicker]?.[colTicker] ?? 0;
                return (
                  <div
                    key={`${rowTicker}-${colTicker}`}
                    className={`flex h-10 w-10 items-center justify-center rounded-md text-[10px] font-bold transition-all shadow-sm ${getCellColor(
                      value
                    )}`}
                  >
                    {value === 1 ? "1.0" : value.toFixed(2)}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
          <span className="text-[11px] text-muted-foreground font-medium">양의 상관 (동조)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200 shadow-sm" />
          <span className="text-[11px] text-muted-foreground font-medium">독립 (분산)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm" />
          <span className="text-[11px] text-muted-foreground font-medium">음의 상관 (역행)</span>
        </div>
      </div>
    </div>
  );
}
