import { Cloud, Sun, CloudRain, Zap, CloudSun, CloudFog, SunMedium } from "lucide-react";
import { motion } from "motion/react";
import { useMarketWeather } from "@/hooks/use-market-weather";
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/app/components/ui";
import { useAuthStore } from "@/store/auth";

export function MarketWeatherWidget() {
  const { data: weather, isLoading, isError } = useMarketWeather();
  const nickname = useAuthStore((state) => state.nickname);

  if (isLoading) {
    return <Skeleton className="h-[120px] w-full rounded-2xl" />;
  }

  if (isError || !weather) {
    return null;
  }

  const getWeatherAppearance = (state: string) => {
    switch (state) {
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
        return { icon: <Cloud className="h-8 w-8 text-gray-400" />, label: state, color: "text-primary" };
    }
  };

  const appearance = getWeatherAppearance(weather.weatherState);

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
              {weather.marketType} Market Insight
            </span>
            <div className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground">{weather.baseDate}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-1 leading-snug">
            {nickname ?? "투자자"}님,<br />
            오늘의 증시는 <span className={appearance.color}>'{appearance.label}'</span>이에요 {appearance.icon.props.children}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary cursor-help">
                  Score {weather.weatherScore}
                </div>
              </TooltipTrigger>
              <TooltipContent align="end">
                <div className="space-y-1 text-left">
                  <p className="font-semibold text-sm">기상 점수 산출 기준</p>
                  <ul className="text-[11px] text-muted-foreground list-disc pl-4">
                    <li>이격도 점수 (40%): MA20 기준 상하편차</li>
                    <li>RSI 상대강도 (30%): 최근 14일 상승압력</li>
                    <li>ADR 등락비율 (30%): 상승/하락 종목 비율</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="mt-1">{appearance.icon}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/50 p-4">
        <p className="text-sm leading-relaxed text-foreground/90">
          {weather.aiSummary}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Top Sectors</span>
          <div className="flex flex-wrap gap-1.5">
            {weather.topSectors.map((s) => (
              <div key={s.sectorCode} className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                <span>{s.emoji}</span>
                <span>{s.sectorName && s.sectorName !== s.sectorCode ? s.sectorName : s.sectorCode}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Watch Out</span>
          <div className="flex flex-wrap gap-1.5">
            {weather.bottomSectors.map((s) => (
              <div key={s.sectorCode} className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                <span>{s.emoji}</span>
                <span>{s.sectorName && s.sectorName !== s.sectorCode ? s.sectorName : s.sectorCode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
