import { expect, test } from "@playwright/test";

const account = (name: string, version = 0) => ({
  accountId: 42, accountType: "ACTUAL", name, brokerLabel: "모의 증권사", baseCurrency: "KRW", accountVersion: version, ledgerVersion: 0,
});

async function authenticate(page: import("@playwright/test").Page, selectActual = false) {
  await page.addInitScript((shouldSelectActual) => {
    localStorage.setItem("auth-storage", JSON.stringify({ state: {
      memberId: 9001, email: "mock@example.test", nickname: "모의 사용자", portfolioId: "42",
      accessToken: "synthetic-token", refreshToken: "synthetic-refresh", joinedDate: null, sessionEpoch: 1,
    }, version: 0 }));
    if (shouldSelectActual) localStorage.setItem("investment-selection-storage", JSON.stringify({ state: {
      byMember: { "9001": { type: "ACTUAL", id: 42 } },
    }, version: 0 }));
  }, selectActual);
}

test("actual account lifecycle stays isolated from simulation requests", async ({ page }, testInfo) => {
  await authenticate(page);
  let rows: ReturnType<typeof account>[] = [];
  let conflictOnce = true;
  const writes: Array<{ method: string; url: string; body: string; headers: Record<string, string> }> = [];
  const forbidden: string[] = [];
  const simulationRequests: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/v1/members/me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { memberId: 9001, nickname: "모의 사용자" } }) });
    if (path === "/api/v1/investment-accounts" && request.method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: rows }) });
    }
    if (path === "/api/v1/investment-accounts" && request.method() === "POST") {
      const body = request.postData() ?? "";
      writes.push({ method: request.method(), url: path, body, headers: request.headers() });
      const input = JSON.parse(body);
      rows = [account(input.name)];
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ data: rows[0] }) });
    }
    if (path === "/api/v1/investment-accounts/42" && request.method() === "GET") {
      if (!rows.length) return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "G003" }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: rows[0] }) });
    }
    if (path === "/api/v1/investment-accounts/42" && request.method() === "PATCH") {
      writes.push({ method: request.method(), url: path, body: request.postData() ?? "", headers: request.headers() });
      if (conflictOnce) {
        conflictOnce = false;
        rows = [account("서버에서 갱신된 이름", 1)];
        return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "I001", message: "conflict" }) });
      }
      const input = JSON.parse(request.postData() ?? "{}");
      rows = [account(input.name, 2)];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: rows[0] }) });
    }
    forbidden.push(path);
    if (path.startsWith("/api/v1/portfolios/")) simulationRequests.push(path);
    return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "MOCK_ONLY_BLOCKED" }) });
  });
  await page.goto("/portfolio");
  await expect(page.getByTestId("investment-screen")).toBeVisible();
  await page.getByRole("button", { name: "실제 계정 추가" }).click();
  await page.getByLabel("계정 이름").fill("실제 계정 A");
  await page.getByLabel("증권사 메모 (선택)").fill("");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("heading", { name: "실제 계정 A" })).toBeVisible();
  await expect(page.getByRole("button", { name: "실제 계정 추가" })).toBeFocused();
  expect(JSON.parse(writes[0].body)).toEqual({ name: "실제 계정 A", baseCurrency: "KRW", brokerLabel: null });
  await page.getByRole("button", { name: "이름 변경" }).click();
  await page.getByRole("textbox", { name: "계정 이름" }).fill("실제 계정 B");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page.getByRole("status")).toContainText("서버에서 갱신된 이름");
  await page.getByRole("button", { name: "최신 정보로 다시 저장" }).click();
  await page.getByRole("textbox", { name: "계정 이름" }).press("Enter");
  await expect(page.getByRole("heading", { name: "실제 계정 B" })).toBeVisible();
  expect(writes).toHaveLength(3);
  expect(writes[0].headers["idempotency-key"]).toBeTruthy();
  expect(writes[1].headers["idempotency-key"]).toBeTruthy();
  expect(writes[2].headers["idempotency-key"]).toBeTruthy();
  expect(writes[2].headers["idempotency-key"]).not.toBe(writes[1].headers["idempotency-key"]);
  expect(writes[1].headers["if-match"]).toBe('"0"');
  expect(writes[2].headers["if-match"]).toBe('"1"');
  expect(forbidden).toEqual([]);
  expect(await page.locator("body").evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("actual-account-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "가상 포트폴리오" }).click();
  await expect(page.getByTestId("portfolio-screen")).toBeVisible();
  await expect.poll(() => simulationRequests).toContain("/api/v1/portfolios/42/analysis/summary");
  await page.getByRole("button", { name: "실제 계정 B" }).click();
  await expect(page.getByRole("heading", { name: "실제 계정 B" })).toBeVisible();
});

test("actual list failure preserves simulation entry", async ({ page }, testInfo) => {
  await authenticate(page);
  const blocked: string[] = [];
  await page.route("**/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/v1/members/me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { memberId: 9001, nickname: "모의 사용자" } }) });
    if (path === "/api/v1/investment-accounts") {
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ code: "G999" }) });
    }
    blocked.push(path);
    return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "MOCK_ONLY_BLOCKED" }) });
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("alert")).toContainText("실제 계정 목록을 불러오지 못했습니다");
  await page.screenshot({ path: testInfo.outputPath("actual-list-error-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "가상 포트폴리오" }).click();
  await expect(page.getByTestId("portfolio-screen")).toBeVisible();
  expect(blocked).toEqual(expect.arrayContaining([expect.stringMatching(/\/api\/v1\/portfolios\/42\/analysis\/summary/)]));
});

test("restores a saved actual selection only after list and detail validation", async ({ page }) => {
  await authenticate(page, true);
  const accountCalls: string[] = [];
  const forbidden: string[] = [];
  await page.route("**/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/v1/members/me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { memberId: 9001, nickname: "모의 사용자" } }) });
    if (path === "/api/v1/investment-accounts") {
      accountCalls.push("list");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [account("저장된 실제 계정")] }) });
    }
    if (path === "/api/v1/investment-accounts/42") {
      accountCalls.push("detail");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: account("저장된 실제 계정") }) });
    }
    forbidden.push(path);
    return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "MOCK_ONLY_BLOCKED" }) });
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "저장된 실제 계정" })).toBeVisible();
  expect(accountCalls).toEqual(expect.arrayContaining(["list", "detail"]));
  expect(forbidden).toEqual([]);
});
