import { Cloud, Sun, CloudRain, Zap, CloudSun, CloudFog, SunMedium } from "lucide-react";
import { motion } from "motion/react";
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/app/components/ui";
import { useAuthStore } from "@/store/auth";
import { MarketWeatherResult } from "@/types/api";

interface MarketWeatherWidgetProps {
  weather?: MarketWeatherResult | null;
  isLoading?: boolean;
  isError?: boolean;
}

export function MarketWeatherWidget({ weather, isLoading, isError }: MarketWeatherWidgetProps) {
  const nickname = useAuthStore((state) => state.nickname);

  if (isLoading) {
    return (
      <div className="px-4 md:px-0">
        <Skeleton className="h-[140px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !weather) {
    return null;
  }

  const getWeatherAppearance = (level: string) => {
    switch (level) {
      case "CLEAR": 
        return { icon: <SunMedium className="h-8 w-8 text-orange-500" />, label: "매우 맑음", color: "text-orange-500" };
      case "SUNNY": 
        return { icon: <Sun className="h-8 w-8 text-yellow-500" />, label: "맑음", color: "text-yellow-500" };
      case "PARTLY_CLOUDY": 
        return { icon: <CloudSun className="h-8 w-8 text-blue-400" />, label: "구름 조금", color: "text-blue-400" };
      case "CLOUDY": 
        return { icon: <Cloud className="h-8 w-8 text-gray-400" />, label: "흐림", color: "text-gray-400" };
      case "FOGGY": 
        return { icon: <CloudFog className="h-8 w-8 text-amber-600" />, label: "안개", color: "text-amber-600" };
      case "RAINY": 
        return { icon: <CloudRain className="h-8 w-8 text-blue-600" />, label: "비", color: "text-blue-600" };
      case "STORMY": 
        return { icon: <Zap className="h-8 w-8 text-purple-600" />, label: "천둥번개", color: "text-purple-600" };
      default: 
        return { icon: <Cloud className="h-8 w-8 text-gray-400" />, label: level, color: "text-primary" };
    }
  };

  const appearance = getWeatherAppearance(weather.weatherLevel);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm md:mx-0"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Market Insight
            </span>
            <div className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground">{weather.asOfDate}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-1 leading-snug">
            {nickname ?? "투자자"}님,<br />
            {weather.weatherMessage.includes("오늘의 증시") ? (
              weather.weatherMessage
            ) : (
              <>오늘의 증시는 <span className={appearance.color}>'{appearance.label}'</span>이에요</>
            )}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary cursor-help">
                  Market Status
                </div>
              </TooltipTrigger>
              <TooltipContent align="end">
                <div className="space-y-1 text-left">
                  <p className="font-semibold text-sm">기상 상태 안내</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    주요 시장 지수의 등락률과 수급 상황을<br />
                    종합하여 도출한 증시 기상도입니다.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="mt-1">{appearance.icon}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">
          {weather.weatherDescription}
        </p>
      </div>
    </motion.div>
  );
}
