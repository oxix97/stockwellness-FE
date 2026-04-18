import { describe, expect, it } from "vitest";
import { getMarketWeatherPresentation } from "../market-weather-presentation";

describe("getMarketWeatherPresentation", () => {
  it("날씨 단계에 맞는 표현 정보를 반환한다", () => {
    const presentation = getMarketWeatherPresentation(
      {
        weatherLevel: "FOGGY",
        weatherMessage: "오늘의 증시는 안개가 꼈어요",
        weatherDescription: "지수는 버티고 있지만 하락 종목이 더 많아 체감은 무거운 편이에요",
        reasonCode: "HIDDEN_WEAKNESS",
        asOfDate: "2026-04-08",
      },
      false,
      false,
    );

    expect(presentation.text).toBe("오늘의 증시는 안개가 꼈어요");
    expect(presentation.emoji).toBe("🌫️");
    expect(presentation.toneClassName).toBe("text-amber-600");
  });

  it("로딩 중에는 중립 표현을 반환한다", () => {
    const presentation = getMarketWeatherPresentation(null, true, false);

    expect(presentation.text).toBe("오늘의 증시를 불러오는 중이에요");
    expect(presentation.emoji).toBe("📊");
  });
});
