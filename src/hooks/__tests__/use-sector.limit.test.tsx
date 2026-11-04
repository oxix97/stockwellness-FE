import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSector } from "../use-sector";
import { sectorApi } from "@/api/sector";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/api/sector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/sector")>();
  return {
    ...actual,
    sectorApi: {
      getFluctuationRanking: vi.fn(),
      getSectorDetail: vi.fn(),
    },
  };
});

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

describe("useSector Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call getFluctuationRanking with limit 10", async () => {
    const mockRanking = Array.from({ length: 5 }, (_, i) => ({
      sectorCode: `S${i}`,
      sectorName: `Sector ${i}`,
      currentPrice: 1000,
      fluctuationRate: 1.5,
      isOverheated: false,
    }));

    vi.mocked(sectorApi.getFluctuationRanking).mockResolvedValue(mockRanking);
    vi.mocked(sectorApi.getSectorDetail).mockResolvedValue({
      sectorCode: "S0",
      sectorName: "Sector 0",
      baseDate: "2026-03-23",
      currentPrice: 1000,
      fluctuationRate: 1.5,
      isOverheated: false,
      diagnosisMessage: "Test",
      leadingStocks: [],
      technicalIndicators: null,
    });

    const { result } = renderHook(() => useSector(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(sectorApi.getFluctuationRanking).toHaveBeenCalledWith({ limit: 10 });
    expect(result.current.data.length).toBe(5);
  });
});
