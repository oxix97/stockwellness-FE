import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { renderWithQuery } from "@/test/test-utils";
import { SectorBottomSheet } from "../SectorBottomSheet";

const mockUseSectorDetail = vi.fn();
const mockUseComparison = vi.fn();

vi.mock("@/hooks/use-sector", () => ({
  useSectorDetail: (...args: unknown[]) => mockUseSectorDetail(...args),
  useSector: () => ({
    useComparison: (...args: unknown[]) => mockUseComparison(...args),
  }),
}));

describe("SectorBottomSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isOverheated false와 null 기술지표·aiOpinion·빈 leadingStocks 공존을 0으로 치환하지 않고 표시한다", () => {
    mockUseSectorDetail.mockReturnValue({ data: undefined, isLoading: false });
    mockUseComparison.mockReturnValue({ data: null, isLoading: false });

    renderWithQuery(
      <MemoryRouter>
        <SectorBottomSheet
          sector={{
            sectorCode: "0002",
            sectorName: "Synthetic KOSPI sector",
            baseDate: "2026-11-17",
            currentPrice: 101.0,
            fluctuationRate: 1.0,
            isOverheated: false,
            diagnosisMessage: "데이터 부족으로 진단이 불가능합니다.",
            leadingStocks: [],
            aiOpinion: null,
            technicalIndicators: {
              ma5: null,
              ma20: null,
              rsi14: null,
              bollingerUpper: null,
              bollingerMid: null,
              bollingerLower: null,
              isGoldenCross: null,
              isDeadCross: null,
            },
          }}
          onClose={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("2026.11.17 종가 기준")).toBeInTheDocument();
    expect(screen.getByText("과열 아님")).toBeInTheDocument();
    expect(screen.getByText("데이터 부족으로 진단이 불가능합니다.")).toBeInTheDocument();
    expect(screen.getByText("AI 업종 요약은 아직 제공되지 않습니다.")).toBeInTheDocument();
    expect(screen.getByText("지표 데이터 미산출")).toBeInTheDocument();
    expect(screen.getByText(/기술적 지표가 아직 집계되지 않아 과열 여부를 확정할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByText("주요 구성 종목 데이터가 없습니다.")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText("0.00%")).not.toBeInTheDocument();
  });
});
