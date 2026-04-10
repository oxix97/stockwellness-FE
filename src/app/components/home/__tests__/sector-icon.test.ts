import { describe, expect, it } from "vitest";
import { getSectorIcon } from "../sector-icon";

describe("getSectorIcon", () => {
  it("대표 업종명을 일관된 이모지로 매핑한다", () => {
    expect(getSectorIcon("반도체")).toBe("📟");
    expect(getSectorIcon("2차전지")).toBe("🔋");
    expect(getSectorIcon("바이오")).toBe("🧪");
    expect(getSectorIcon("조선")).toBe("🚢");
    expect(getSectorIcon("금융")).toBe("🏦");
  });

  it("알 수 없는 업종명 또는 null은 fallback을 반환한다", () => {
    expect(getSectorIcon("정체불명업종")).toBe("📊");
    expect(getSectorIcon(null)).toBe("📊");
  });
});
