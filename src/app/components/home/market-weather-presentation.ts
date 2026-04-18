import { MarketWeatherLevel, MarketWeatherResult } from "@/types/api";

export interface MarketWeatherPresentation {
  text: string;
  description: string;
  emoji: string;
  toneClassName: string;
}

const WEATHER_APPEARANCE: Record<MarketWeatherLevel, { emoji: string; toneClassName: string }> = {
  CLEAR: { emoji: "☀️", toneClassName: "text-up" },
  SUNNY: { emoji: "🌤️", toneClassName: "text-up" },
  PARTLY_CLOUDY: { emoji: "🌥️", toneClassName: "text-emerald-600" },
  CLOUDY: { emoji: "⛅", toneClassName: "text-muted-foreground" },
  FOGGY: { emoji: "🌫️", toneClassName: "text-amber-600" },
  RAINY: { emoji: "🌧️", toneClassName: "text-down" },
  STORMY: { emoji: "⛈️", toneClassName: "text-down" },
};

export function getMarketWeatherPresentation(
  weather: MarketWeatherResult | null | undefined,
  isLoading: boolean,
  isError: boolean,
): MarketWeatherPresentation {
  if (isLoading) {
    return {
      text: "오늘의 증시를 불러오는 중이에요",
      description: "시장의 온도를 정리해서 보여드릴게요",
      emoji: "📊",
      toneClassName: "text-muted-foreground",
    };
  }

  if (isError || !weather) {
    return {
      text: "오늘의 증시는 흐림이에요",
      description: "시장 데이터를 잠시 확인하지 못해 중립적으로 보여드리고 있어요",
      emoji: "📊",
      toneClassName: "text-muted-foreground",
    };
  }

  const appearance = WEATHER_APPEARANCE[weather.weatherLevel];
  return {
    text: weather.weatherMessage,
    description: weather.weatherDescription,
    emoji: appearance.emoji,
    toneClassName: appearance.toneClassName,
  };
}
