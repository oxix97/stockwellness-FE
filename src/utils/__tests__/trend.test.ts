import { describe, expect, it } from "vitest";
import { getTrendClassName, getTrendTone } from "../trend";

describe("trend helpers", () => {
  it("maps signed values to the shared financial tones", () => {
    expect(getTrendTone(1)).toBe("up");
    expect(getTrendTone(-1)).toBe("down");
    expect(getTrendTone(0)).toBe("neutral");
  });

  it("returns red/up, blue/down, and neutral classes", () => {
    expect(getTrendClassName(1)).toBe("text-up");
    expect(getTrendClassName(-1)).toBe("text-down");
    expect(getTrendClassName(0)).toBe("text-muted-foreground");
  });
});

