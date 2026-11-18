import { fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Home } from "../Home";
import { useMarketIndex, useMarketWeather } from "@/hooks/use-market-index";
import { MemoryRouter } from "react-router";
import { renderWithQuery } from "@/test/test-utils";

// 훅 모킹
vi.mock("@/hooks/use-market-index");
vi.mock("@/app/components/home/StockSupplyRankingSection", () => ({
  StockSupplyRankingSection: () => <div>종목 수급 랭킹 섹션</div>,
}));
vi.mock("@/app/components/home/SectorRankingSection", () => ({
  SectorRankingSection: () => <div>섹터 랭킹 섹션</div>,
}));
vi.mock("@/app/components/home/NewListingsSection", () => ({
  NewListingsSection: () => <div>신규 상장 섹션</div>,
}));
vi.mock("@/app/components/home/MarketIndexCard", () => ({
  MarketIndexSection: () => <div>시장 현황 섹션</div>,
}));
vi.mock("@/app/components/home/SectorBottomSheet", () => ({
  SectorBottomSheet: () => null,
}));

describe("Home Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMarketWeather as any).mockReturnValue({
      data: {
        baseDate: "2026-11-16",
        marketType: "KOSPI",
        weatherScore: 48,
        weatherState: "CLOUDY",
        weatherEmoji: "⛅",
        aiSummary: null,
        topSectors: [],
        bottomSectors: [],
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    (useMarketIndex as any).mockReturnValue({
      data: {
        indexes: [{ ticker: "0001", name: "코스피 종합", fluctuationRate: 0.8, fluctuationAmount: 10, currentPrice: 2600 }],
        weather: {
          weatherLevel: "SUNNY",
          weatherMessage: "오늘의 증시는 맑음이에요",
          weatherDescription: "주요 지수가 고르게 오르며 투자심리가 비교적 안정적인 편이에요",
          reasonCode: "STEADY_ADVANCE",
          asOfDate: "2026-04-08",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("홈 탭에 시장 현황, 수급, 섹터, 신규 상장 섹션을 표시한다", () => {
    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("시장 현황 섹션")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "알림 설정" })).toBeInTheDocument();
    expect(screen.getAllByText("종목 수급 랭킹 섹션")).toHaveLength(2);
    expect(screen.getByText("섹터 랭킹 섹션")).toBeInTheDocument();
    expect(screen.getByText("신규 상장 섹션")).toBeInTheDocument();
    expect(screen.getByText("2026.11.16 종가 기준 · KOSPI")).toBeInTheDocument();
    expect(screen.getByText(/기상 점수 48점/)).toBeInTheDocument();
  });

  it("6.2b Market Weather 계약: KOSPI 기본/KOSDAQ 전환, 이전 EOD baseDate, null AI 요약을 정확히 표시한다", () => {
    (useMarketIndex as any).mockReturnValue({
      data: {
        indexes: [{ ticker: "0001", name: "KOSPI", fluctuationRate: 0.5, fluctuationAmount: 10, currentPrice: 2600 }],
        weather: null,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    (useMarketWeather as any).mockImplementation((marketType: string) => {
      if (marketType === "KOSDAQ") {
        return {
          data: {
            baseDate: "2026-11-17",
            marketType: "KOSDAQ",
            weatherScore: 62,
            weatherState: "PARTLY_CLOUDY",
            weatherEmoji: "🌤️",
            aiSummary: null,
            topSectors: [{ sectorCode: "1001", sectorName: "Synthetic KOSDAQ", score: 62, state: "PARTLY_CLOUDY", emoji: "🌤️", aiTitle: null, aiInsight: null }],
            bottomSectors: [],
          },
          isLoading: false,
          isError: false,
          isFetching: false,
          refetch: vi.fn(),
        };
      }
      return {
        data: {
          baseDate: "2026-11-16",
          marketType: "KOSPI",
          weatherScore: 48,
          weatherState: "CLOUDY",
          weatherEmoji: "⛅",
          aiSummary: null,
          topSectors: [{ sectorCode: "0002", sectorName: "Synthetic KOSPI sector", score: 48, state: "CLOUDY", emoji: "⛅", aiTitle: null, aiInsight: null }],
          bottomSectors: [],
        },
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("2026.11.16 종가 기준 · KOSPI")).toBeInTheDocument();
    expect(screen.getByText(/기상 점수 48점/)).toBeInTheDocument();
    expect(screen.getByText("AI 시장 요약은 아직 제공되지 않습니다.")).toBeInTheDocument();
    expect(screen.getByText(/Synthetic KOSPI sector/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "KOSDAQ" }));
    expect(screen.getByText("2026.11.17 종가 기준 · KOSDAQ")).toBeInTheDocument();
    expect(screen.getByText(/기상 점수 62점/)).toBeInTheDocument();
    expect(screen.getByText(/Synthetic KOSDAQ/)).toBeInTheDocument();
  });

  it("6.2b Market Weather data가 null(S000 data 생략)이면 0점·오류·실시간 문구 없이 빈 EOD 상태를 표시한다", () => {
    (useMarketIndex as any).mockReturnValue({
      data: { indexes: [{ ticker: "0001", name: "KOSPI", fluctuationRate: 0.5, fluctuationAmount: 10, currentPrice: 2600 }], weather: null },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    (useMarketWeather as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("확인된 EOD 시장 기상도가 없습니다")).toBeInTheDocument();
    expect(screen.queryByText(/0점/)).not.toBeInTheDocument();
    expect(screen.queryByText(/실시간/)).not.toBeInTheDocument();
  });

  it("KOSDAQ 기상도 data가 null이어도 레거시 KOSPI 날씨로 대체하지 않고 KOSDAQ 빈 상태를 표시한다", () => {
    (useMarketWeather as any).mockImplementation((marketType: string) => {
      if (marketType === "KOSDAQ") {
        return {
          data: null,
          isLoading: false,
          isError: false,
          isFetching: false,
          refetch: vi.fn(),
        };
      }
      return {
        data: {
          baseDate: "2026-11-16",
          marketType: "KOSPI",
          weatherScore: 48,
          weatherState: "CLOUDY",
          weatherEmoji: "⛅",
          aiSummary: null,
          topSectors: [],
          bottomSectors: [],
        },
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "KOSDAQ" }));
    expect(screen.getByRole("button", { name: "KOSDAQ" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("확인된 EOD 시장 기상도가 없습니다")).toBeInTheDocument();
    expect(screen.getByText(/KOSDAQ 시장의 완전한 EOD 기상도/)).toBeInTheDocument();
    expect(screen.queryByText(/오늘의 증시는/)).not.toBeInTheDocument();
  });

  it("기상도 요청 실패 시 레거시 KOSPI 날씨로 가리지 않고 오류 안내와 다시 시도 버튼을 표시한다", () => {
    const weatherRefetch = vi.fn();
    (useMarketWeather as any).mockImplementation((marketType: string) => ({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: weatherRefetch,
      marketType,
    }));

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("시장 기상도 정보를 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.queryByText(/오늘의 증시는/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(weatherRefetch).toHaveBeenCalledTimes(1);
  });

  it("KOSDAQ 전환 로딩 중에는 선택 버튼 aria-pressed를 유지하고 레거시 KOSPI 날씨를 노출하지 않는다", () => {
    (useMarketWeather as any).mockImplementation((marketType: string) => {
      if (marketType === "KOSDAQ") {
        return {
          data: undefined,
          isLoading: true,
          isError: false,
          isFetching: true,
          refetch: vi.fn(),
        };
      }
      return {
        data: {
          baseDate: "2026-11-16",
          marketType: "KOSPI",
          weatherScore: 48,
          weatherState: "CLOUDY",
          weatherEmoji: "⛅",
          aiSummary: null,
          topSectors: [],
          bottomSectors: [],
        },
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      };
    });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "KOSDAQ" }));
    expect(screen.getByRole("button", { name: "KOSDAQ" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(/오늘의 증시는/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026\.11\.16 종가 기준 · KOSPI/)).not.toBeInTheDocument();
  });

  it("확정 시장 데이터가 없으면 빈 상태를 안내한다", () => {
    (useMarketIndex as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { isAxiosError: true, response: { data: { code: "S002" } } },
      refetch: vi.fn(),
    });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("확정된 EOD 시장 데이터가 아직 없습니다")).toBeInTheDocument();
    expect(screen.getByText(/확정된 EOD 데이터가 없어 지수와 기상도를 표시할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "검색으로 이동" })).toBeInTheDocument();
  });

  it("시장 API의 일반 오류에는 원문 대신 재시도 안내를 표시한다", () => {
    const refetch = vi.fn();
    (useMarketIndex as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { isAxiosError: true, response: { data: { code: "G004", message: "raw server error" } } },
      refetch,
    });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("시장 데이터를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.queryByText("raw server error")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
