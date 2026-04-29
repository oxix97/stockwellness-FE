import { describe, expect, it } from "vitest";
import { formatSignedCurrency, formatSignedNumber, formatSignedPercent } from "../format";

describe("signed value formatters", () => {
  it("formats signed percent values with Korean market arrows", () => {
    expect(formatSignedPercent(1.24)).toBe("▲ 1.24%");
    expect(formatSignedPercent(-0.82)).toBe("▼ 0.82%");
    expect(formatSignedPercent(0)).toBe("0.00%");
    expect(formatSignedPercent(null)).toBe("0.00%");
    expect(formatSignedPercent(Number.NaN)).toBe("0.00%");
  });

  it("formats signed currency values with won text units", () => {
    expect(formatSignedCurrency(12500)).toBe("12,500 원");
    expect(formatSignedCurrency(-8100)).toBe("8,100 원");
    expect(formatSignedCurrency(0)).toBe("0 원");
  });

  it("can omit arrows and signs when a compact context needs plain numbers", () => {
    expect(formatSignedPercent(12.3, { showArrow: false, showSign: false })).toBe("12.30%");
    expect(formatSignedNumber(-1234, { showArrow: false, showSign: false })).toBe("1,234");
  });
});
