import { describe, expect, it } from "vitest";
import { normalizeAccountText, safeAccountErrorMessage, validateAccountInput } from "@/app/components/actual/ActualAccountSheet";

describe("actual account text rules", () => {
  it("normalizes the backend Unicode White_Space set at both ends", () => {
    const whiteSpace = "\u0009\u000A\u000B\u000C\u000D\u0020\u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000";
    expect(normalizeAccountText(`${whiteSpace}A${whiteSpace}`)).toBe("A");
  });

  it("counts Unicode code points, including emoji, for 50 and 51 boundaries", () => {
    expect(validateAccountInput("😀".repeat(50), "")).toEqual({ name: "😀".repeat(50), brokerLabel: null });
    expect(validateAccountInput("😀".repeat(51), "")).toEqual({ error: "계정 이름은 공백 제외 1~50자로 입력해 주세요." });
  });

  it("accepts 100 broker code points and rejects 101", () => {
    expect(validateAccountInput("계좌", "가".repeat(100))).toEqual({ name: "계좌", brokerLabel: "가".repeat(100) });
    expect(validateAccountInput("계좌", "가".repeat(101))).toEqual({ error: "증권사 메모는 100자 이내로 입력해 주세요." });
  });

  it("shows safe messages for account API errors without exposing raw details", () => {
    const message = (code: string) => safeAccountErrorMessage({ response: { data: { code, message: "sensitive raw server detail" } } });
    expect(message("I002")).toContain("요청이 처리되지 않았습니다");
    expect(message("I008")).toContain("계정 변경을 완료하지 못했습니다");
    expect(message("G001")).toContain("입력한 내용을 확인해 주세요");
    expect(message("G003")).toContain("계정을 찾을 수 없습니다");
    expect(safeAccountErrorMessage({ response: { status: 404 } })).toContain("계정을 찾을 수 없습니다");
    expect(message("I008")).not.toContain("sensitive");
  });
});
