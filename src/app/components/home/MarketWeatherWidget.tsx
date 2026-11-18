import { Cloud, Sun, CloudRain, Zap, CloudSun, CloudFog, SunMedium } from "lucide-react";
import { motion } from "motion/react";
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/app/components/ui";
import { useAuthStore } from "@/store/auth";
import {
  MarketWeatherLatestResponse,
  MarketWeatherMarketType,
  MarketWeatherResult,
} from "@/types/api";

interface MarketWeatherWidgetProps {
  latestWeather?: MarketWeatherLatestResponse | null;
  weather?: MarketWeatherResult | null;
  marketType?: MarketWeatherMarketType;
  onMarketTypeChange?: (marketType: MarketWeatherMarketType) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const MARKET_TYPES: ReadonlyArray<MarketWeatherMarketType> = ["KOSPI", "KOSDAQ"];

function formatEodBaseDate(date: string | null | undefined): string {
  if (!date) return "기준일 확인 불가";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  return match ? `${match[1]}.${match[2]}.${match[3]}` : date.replace(/-/g, ".");
}

export function MarketWeatherWidget({
  latestWeather,
  weather,
  marketType = "KOSPI",
  onMarketTypeChange,
  isLoading,
  isError,
  onRetry,
}: MarketWeatherWidgetProps) {
  const nickname = useAuthStore((state) => state.nickname);

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

  const marketToggle = onMarketTypeChange ? (
    <div className="flex items-center gap-1.5" role="group" aria-label="시장 기상도 대상 시장">
      {MARKET_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={marketType === type}
          onClick={() => onMarketTypeChange(type)}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            marketType === type
              ? "bg-primary text-primary-foreground"
              : "border border-border/70 bg-background/80 text-muted-foreground hover:text-foreground"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  ) : null;

  const matchedLatestWeather =
    latestWeather && (!latestWeather.marketType || latestWeather.marketType === marketType)
      ? latestWeather
      : null;

  if (isLoading) {
    return (
      <div className="px-4 md:px-0 space-y-2">
        {marketToggle}
        <Skeleton className="h-[140px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError && !matchedLatestWeather) {
    return (
      <div className="mx-4 rounded-2xl border border-border/60 bg-card/40 p-5 md:mx-0" role="alert">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Weather</span>
          {marketToggle}
        </div>
        <p className="text-sm font-semibold text-foreground">시장 기상도 정보를 불러오지 못했습니다</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {marketType} 시장 기상도를 불러오는 중 오류가 발생했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  // 신규 6.2b 계약: /api/v1/market-weather/latest 응답 처리
  if (matchedLatestWeather) {
    const appearance = getWeatherAppearance(matchedLatestWeather.weatherState);
    const topSectors = (matchedLatestWeather.topSectors ?? []).slice(0, 3);
    const bottomSectors = (matchedLatestWeather.bottomSectors ?? []).slice(0, 3);
    const aiSummaryText = matchedLatestWeather.aiSummary?.trim()
      ? matchedLatestWeather.aiSummary
      : "AI 시장 요약은 아직 제공되지 않습니다.";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm md:mx-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Market Insight
            </span>
            <div className="h-1 w-1 rounded-full bg-border" />
            <span className="text-xs font-medium text-muted-foreground">
              {formatEodBaseDate(matchedLatestWeather.baseDate)} 종가 기준 · {matchedLatestWeather.marketType}
            </span>
          </div>
          {marketToggle}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-snug">
              {nickname ?? "투자자"}님,
              <br />
              {matchedLatestWeather.marketType} 기상도는{" "}
              <span className={appearance.color}>&apos;{appearance.label}&apos;</span>이에요
            </h3>
            <p className="text-xs font-semibold text-muted-foreground">
              기상 점수 {matchedLatestWeather.weatherScore}점 {matchedLatestWeather.weatherEmoji}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary cursor-help">
                    EOD Weather
                  </div>
                </TooltipTrigger>
                <TooltipContent align="end">
                  <div className="space-y-1 text-left">
                    <p className="font-semibold text-sm">기상 상태 안내</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      최근 완전한 EOD 기준 섹터 점수를<br />
                      종합하여 산출한 시장 기상도입니다.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="mt-1">{appearance.icon}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-muted/50 p-4">
          <p className="text-sm leading-relaxed text-foreground/90">{aiSummaryText}</p>
        </div>

        {(topSectors.length > 0 || bottomSectors.length > 0) && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {topSectors.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5">상위 업종</p>
                <ul className="space-y-1">
                  {topSectors.map((sector) => (
                    <li key={sector.sectorCode} className="text-xs text-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{sector.emoji} {sector.sectorName}</span>
                        <span className="shrink-0 font-mono text-muted-foreground">{sector.score}점</span>
                      </div>
                      {(sector.aiTitle || sector.aiInsight) && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {sector.aiTitle || sector.aiInsight}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bottomSectors.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5">하위 업종</p>
                <ul className="space-y-1">
                  {bottomSectors.map((sector) => (
                    <li key={sector.sectorCode} className="text-xs text-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{sector.emoji} {sector.sectorName}</span>
                        <span className="shrink-0 font-mono text-muted-foreground">{sector.score}점</span>
                      </div>
                      {(sector.aiTitle || sector.aiInsight) && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {sector.aiTitle || sector.aiInsight}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // S000 + data 생략(null) 또는 빈 응답/미일치 시장: 레거시 KOSPI 날씨로 대체하지 않음
  if (latestWeather === null || onMarketTypeChange || !weather) {
    return (
      <div className="mx-4 rounded-2xl border border-border/50 bg-card/30 p-5 md:mx-0" role="status">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Market Insight
          </span>
          {marketToggle}
        </div>
        <p className="text-sm font-bold text-foreground">확인된 EOD 시장 기상도가 없습니다</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {marketType} 시장의 완전한 EOD 기상도 데이터가 아직 집계되지 않았습니다. 데이터가 확정되면 기준일과 함께 표시됩니다.
        </p>
      </div>
    );
  }

  const appearance = getWeatherAppearance(weather.weatherLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-sm md:mx-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Market Insight
          </span>
          <div className="h-1 w-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground">{formatEodBaseDate(weather.asOfDate)}</span>
        </div>
        {marketToggle}
      </div>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-1 leading-snug">
            {nickname ?? "투자자"}님,<br />
            {weather.weatherMessage.includes("오늘의 증시") ? (
              weather.weatherMessage
            ) : (
              <>기준일 증시는 <span className={appearance.color}>&apos;{appearance.label}&apos;</span>이에요</>
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
