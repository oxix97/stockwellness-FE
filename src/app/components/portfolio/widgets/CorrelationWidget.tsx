import React from "react";
import { usePortfolioCorrelation } from "@/hooks/use-portfolio";
import { Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
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

  // 상관계수에 따른 스타일 결정 함수
  const getCellStyle = (value: number) => {
    // 자기 자신 (1.0)
    if (value >= 0.99) return { 
      backgroundColor: "var(--color-secondary)", 
      color: "var(--color-muted-foreground)",
      opacity: 0.5 
    };

    if (value >= 0.7) return { 
      backgroundColor: "rgba(255, 71, 86, 0.9)", // Strong Up
      color: "white" 
    };
    if (value >= 0.4) return { 
      backgroundColor: "rgba(255, 71, 86, 0.5)", // Medium Up
      color: "white" 
    };
    if (value >= 0.1) return { 
      backgroundColor: "rgba(255, 71, 86, 0.15)", // Weak Up
      color: "var(--color-up)" 
    };
    
    if (value <= -0.7) return { 
      backgroundColor: "rgba(49, 130, 246, 0.9)", // Strong Down
      color: "white" 
    };
    if (value <= -0.4) return { 
      backgroundColor: "rgba(49, 130, 246, 0.5)", // Medium Down
      color: "white" 
    };
    if (value <= -0.1) return { 
      backgroundColor: "rgba(49, 130, 246, 0.15)", // Weak Down
      color: "var(--color-down)" 
    };

    return { 
      backgroundColor: "var(--color-secondary)", 
      color: "var(--color-muted-foreground)" 
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold tracking-tight text-foreground">종목 간 상관관계</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-secondary transition-colors">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] p-4 rounded-2xl border-border bg-card/95 backdrop-blur-md shadow-2xl">
                <p className="font-black text-[13px] mb-2 border-b border-border pb-2 text-foreground">리스크 분산 가이드</p>
                <div className="space-y-2 text-[11px] font-medium leading-relaxed">
                  <p><span className="text-up font-bold">0.7 이상</span>: 두 종목이 거의 같이 움직입니다. 한쪽이 하락할 때 같이 떨어질 위험이 높습니다.</p>
                  <p><span className="text-muted-foreground font-bold">-0.3 ~ 0.3</span>: 서로 상관이 없습니다. 하나가 떨어져도 다른 하나는 버텨줄 확률이 높아 분산 효과가 좋습니다.</p>
                  <p><span className="text-down font-bold">-0.7 이하</span>: 정반대로 움직입니다. 한쪽의 손실을 다른 쪽이 수익으로 상쇄하는 강력한 헤지 수단이 됩니다.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
        <div 
          className="grid gap-1 min-w-max" 
          style={{ gridTemplateColumns: `70px repeat(${tickers.length}, 44px)` }}
        >
          {/* Header row */}
          <div className="h-12" />
          {tickers.map((ticker) => (
            <div key={ticker} className="flex h-12 w-11 items-end justify-center pb-2">
              <span className="text-[10px] font-black text-muted-foreground rotate-[-45deg] origin-bottom-left whitespace-nowrap pl-2">
                {ticker}
              </span>
            </div>
          ))}

          {/* Data rows */}
          {tickers.map((rowTicker) => (
            <React.Fragment key={rowTicker}>
              <div className="flex h-11 w-[70px] items-center">
                <span className="text-[11px] font-bold text-foreground truncate pr-2">
                  {rowTicker}
                </span>
              </div>
              {tickers.map((colTicker) => {
                const value = matrix[rowTicker]?.[colTicker] ?? 0;
                const style = getCellStyle(value);
                return (
                  <TooltipProvider key={`${rowTicker}-${colTicker}`}>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05, zIndex: 10 }}
                          style={style}
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-[10px] font-black font-mono transition-all shadow-sm border border-white/5"
                        >
                          {value >= 0.99 ? "1.0" : value.toFixed(2)}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-bold text-xs py-2">
                        {rowTicker} × {colTicker}: <span style={{ color: value >= 0 ? "var(--color-up)" : "var(--color-down)" }}>{value.toFixed(3)}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 border-t border-border/40 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-up shadow-[0_0_8px_rgba(255,71,86,0.4)]" />
          <span className="text-[10px] text-muted-foreground font-bold">동조 (위험)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-secondary" />
          <span className="text-[10px] text-muted-foreground font-bold">독립 (분산)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-down shadow-[0_0_8px_rgba(49,130,246,0.4)]" />
          <span className="text-[10px] text-muted-foreground font-bold">역행 (헤지)</span>
        </div>
      </div>
    </div>
  );
}
