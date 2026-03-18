import { describe, it, expect } from "vitest";
import { sectorApi } from "../sector";

describe("sectorApi", () => {
  it("should be defined", () => {
    expect(sectorApi).toBeDefined();
    expect(sectorApi.getFluctuationRanking).toBeDefined();
    expect(sectorApi.getSectorDetail).toBeDefined();
  });

  it("should have getSupplyRanking function defined", () => {
    expect(sectorApi.getSupplyRanking).toBeDefined();
    expect(typeof sectorApi.getSupplyRanking).toBe("function");
  });
});
