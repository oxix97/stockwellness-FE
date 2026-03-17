import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSector } from "../use-sector";
import { sectorApi } from "@/api/sector";
import React from "react";

// sectorApi 모킹
vi.mock("@/api/sector", () => ({
  sectorApi: {
    getFluctuationRanking: vi.fn(),
    getSectorDetail: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSector hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("랭킹 데이터를 성공적으로 가져오고 상세 정보와 결합한다", async () => {
    const mockRanking = [
      { sectorCode: "001", sectorName: "바이오", currentPrice: 100, fluctuationRate: 5, isOverheated: false },
    ];
    const mockDetail = {
      sectorCode: "001",
      sectorName: "바이오",
      diagnosisMessage: "저평가 국면",
      leadingStocks: [{ ticker: "123456", name: "대장주", fluctuationRate: 10, tradeVolume: 1000, transactionAmt: 5000 }],
    };

    (sectorApi.getFluctuationRanking as any).mockResolvedValue(mockRanking);
    (sectorApi.getSectorDetail as any).mockResolvedValue(mockDetail);

    const { result } = renderHook(() => useSector(), {
      wrapper: createWrapper(),
    });

    // 로딩 상태 확인
    expect(result.current.isLoading).toBe(true);

    // 데이터 로드 대기
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 결과 검증
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual({
      ...mockRanking[0],
      diagnosisMessage: "저평가 국면",
      leadingStocks: mockDetail.leadingStocks,
    });
    
    expect(sectorApi.getFluctuationRanking).toHaveBeenCalledWith({ limit: 3 });
    expect(sectorApi.getSectorDetail).toHaveBeenCalledWith("001");
  });

  it("API 호출 중 에러가 발생하면 isError가 true가 된다", async () => {
    (sectorApi.getFluctuationRanking as any).mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => useSector(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
