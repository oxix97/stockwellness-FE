import { MarketWeatherLevel, MarketWeatherResult } from "@/types/api";

export interface MarketWeatherPresentation {
  text: string;
  description: string;
  emoji: string;
  toneClassName: string;
}

const WEATHER_APPEARANCE: Record<string, { emoji: string; toneClassName: string; label: string }> = {
  CLEAR: { emoji: "☀️", toneClassName: "text-orange-500", label: "매우 맑음" },
  SUNNY: { emoji: "🌤️", toneClassName: "text-yellow-500", label: "맑음" },
  PARTLY_CLOUDY: { emoji: "🌥️", toneClassName: "text-blue-400", label: "구름 조금" },
  CLOUDY: { emoji: "⛅", toneClassName: "text-muted-foreground", label: "흐림" },
  FOGGY: { emoji: "🌫️", toneClassName: "text-amber-600", label: "안개" },
  RAINY: { emoji: "🌧️", toneClassName: "text-blue-600", label: "비" },
  STORMY: { emoji: "⛈️", toneClassName: "text-purple-600", label: "천둥번개" },
};

export function getMarketWeatherPresentation(
  weather: any, // API 응답 타입에 맞춰 유연하게 처리
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

  const state = weather.weatherState || "CLOUDY";
  const appearance = WEATHER_APPEARANCE[state] || WEATHER_APPEARANCE.CLOUDY;

  return {
    text: `오늘의 증시는 ${appearance.label}이에요`,
    description: weather.aiSummary || "시장의 주요 지표를 기반으로 분석한 결과입니다.",
    emoji: appearance.emoji,
    toneClassName: appearance.toneClassName,
  };
}
