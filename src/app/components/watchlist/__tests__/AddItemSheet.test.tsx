import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import { AddItemSheet } from "../AddItemSheet";

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

// useSearch mock
vi.mock("@/hooks/use-search", () => ({
  useSearch: vi.fn(),
}));

// useWatchlist mock
vi.mock("@/hooks/use-watchlist", () => ({
  useWatchlist: vi.fn(),
}));

import { useSearch } from "@/hooks/use-search";
import { useWatchlist } from "@/hooks/use-watchlist";

const mockUseSearch = useSearch as ReturnType<typeof vi.fn>;
const mockUseWatchlist = useWatchlist as ReturnType<typeof vi.fn>;

const mockAddItem = vi.fn();
const mockSetKeyword = vi.fn();

function makeSearchResult(overrides?: Partial<{ ticker: string; name: string; marketType: string; sectorName: string }>) {
  return {
    ticker: "005930",
    name: "삼성전자",
    marketType: "KOSPI",
    sectorName: "전기전자",
    status: "ACTIVE",
    ...overrides,
  };
}

describe("AddItemSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWatchlist.mockReturnValue({
      addItem: { mutate: mockAddItem, isPending: false },
    });
  });

  it("초기 상태: 검색 안내 문구 렌더링", () => {
    mockUseSearch.mockReturnValue({
      keyword: "",
      setKeyword: mockSetKeyword,
      autocomplete: { data: undefined, isLoading: false },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    expect(screen.getByText("종목명 또는 티커를 입력하세요")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("티커 또는 종목명 검색")).toBeInTheDocument();
  });

  it("검색 중 스켈레톤 표시", () => {
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: mockSetKeyword,
      autocomplete: { data: undefined, isLoading: true },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("검색 결과 없을 때 안내 문구 표시", () => {
    mockUseSearch.mockReturnValue({
      keyword: "없는종목",
      setKeyword: mockSetKeyword,
      autocomplete: { data: { pages: [{ content: [] }] }, isLoading: false },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });

  it("검색 결과 종목 목록 표시", () => {
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: mockSetKeyword,
      autocomplete: {
        data: { pages: [{ content: [makeSearchResult(), makeSearchResult({ ticker: "000660", name: "SK하이닉스" })] }] },
        isLoading: false,
      },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument();
    expect(screen.getAllByText("추가").length).toBe(2);
  });

  it("이미 추가된 종목은 '추가됨' 표시 + 버튼 비활성화", () => {
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: mockSetKeyword,
      autocomplete: {
        data: { pages: [{ content: [makeSearchResult({ ticker: "005930" })] }] },
        isLoading: false,
      },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={["005930"]} onClose={vi.fn()} />
    );

    expect(screen.getByText("추가됨")).toBeInTheDocument();
    expect(screen.queryByText("추가")).not.toBeInTheDocument();
  });

  it("추가 버튼 클릭 시 addItem.mutate 호출", async () => {
    mockAddItem.mockImplementation((_args: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess());
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: mockSetKeyword,
      autocomplete: {
        data: { pages: [{ content: [makeSearchResult()] }] },
        isLoading: false,
      },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByText("추가").closest("button")!);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(
        { groupId: 1, body: { ticker: "005930" } },
        expect.any(Object)
      );
    });
  });

  it("추가 성공 후 해당 종목 '추가됨'으로 변경", async () => {
    mockAddItem.mockImplementation((_args: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess());
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: mockSetKeyword,
      autocomplete: {
        data: { pages: [{ content: [makeSearchResult()] }] },
        isLoading: false,
      },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByText("추가").closest("button")!);

    await waitFor(() => {
      expect(screen.getByText("추가됨")).toBeInTheDocument();
    });
  });

  it("X 버튼 클릭 시 검색어 초기화", () => {
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: mockSetKeyword,
      autocomplete: { data: undefined, isLoading: false },
    });

    renderWithQuery(
      <AddItemSheet groupId={1} existingTickers={[]} onClose={vi.fn()} />
    );

    // X 버튼 (검색어 지우기)
    const xButtons = document.querySelectorAll("button svg.lucide-x");
    xButtons[0]?.closest("button")?.click();

    expect(mockSetKeyword).toHaveBeenCalledWith("");
  });
});
