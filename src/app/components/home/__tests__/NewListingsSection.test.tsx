import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { renderWithQuery } from "@/test/test-utils";
import { NewListingsSection } from "../NewListingsSection";

vi.mock("@/hooks/use-stock", () => ({
  useStock: () => ({
    newListings: {
      data: [
        {
          ticker: "456789",
          name: "그린에너지",
          marketType: "KOSDAQ",
          sectorName: "친환경",
          status: "HOT",
        },
      ],
      isLoading: false,
    },
  }),
}));

describe("NewListingsSection", () => {
  it("신규 상장 카드는 초록 계열 surface와 배지를 사용한다", () => {
    renderWithQuery(<NewListingsSection />);

    expect(screen.getByText("그린에너지")).toBeInTheDocument();
    expect(screen.getByText("NEW")).toBeInTheDocument();
    expect(screen.getByText("🔥 HOT")).toBeInTheDocument();
    expect(screen.getByText("KOSDAQ")).toBeInTheDocument();
    expect(screen.getByText("그린에너지").closest("button")).toHaveClass("border-emerald-100/80");
  });
});
