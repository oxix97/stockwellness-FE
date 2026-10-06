import { beforeEach, describe, expect, it } from "vitest";
import { useInvestmentSelection } from "@/store/investment-selection";
import { useAuthStore } from "@/store/auth";

describe("investment selection", () => {
  beforeEach(() => {
    localStorage.clear();
    useInvestmentSelection.setState({ byMember: {} });
    useAuthStore.getState().logout();
  });

  it("persists only member-scoped selection type and ID", () => {
    useInvestmentSelection.getState().select(7, { type: "ACTUAL", id: 42 });
    useInvestmentSelection.getState().select(8, { type: "SIMULATION", id: "42" });
    const stored = JSON.parse(localStorage.getItem("investment-selection-storage")!);
    expect(stored.state.byMember).toEqual({ 7: { type: "ACTUAL", id: 42 }, 8: { type: "SIMULATION", id: "42" } });
    expect(JSON.stringify(stored)).not.toMatch(/accountVersion|brokerLabel|name|token/i);
  });

  it("keeps the legacy portfolioId unchanged when selecting an actual account", () => {
    useAuthStore.getState().setPortfolioId("42");
    useInvestmentSelection.getState().select(7, { type: "ACTUAL", id: 42 });
    expect(useAuthStore.getState().portfolioId).toBe("42");
  });
});
