import { expect, test } from './fixtures/mock-only-test';

test('가상 위저드는 375px에서 서버 계산 계약으로 생성한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        memberId: 9001,
        email: 'mock@example.test',
        nickname: '모의 사용자',
        portfolioId: null,
        accessToken: 'synthetic-token',
        refreshToken: 'synthetic-refresh',
        joinedDate: null,
        sessionEpoch: 1,
      },
      version: 0,
    }));
  });

  const createRequests: unknown[] = [];
  await page.route('**/api/v1/members/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { memberId: 9001, nickname: '모의 사용자' } }) }),
  );
  await page.route('**/api/v1/investment-accounts', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }),
  );
  await page.route('**/api/v1/stocks/popular-search', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }),
  );
  await page.route('**/api/v1/stocks/search/history', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }),
  );
  await page.route('**/api/v1/stocks/search*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          content: [{ ticker: '005930', name: '삼성전자', marketType: 'KOSPI', sectorName: '전기전자', status: 'ACTIVE' }],
          number: 0,
          size: 20,
          numberOfElements: 1,
          first: true,
          last: true,
          hasNext: false,
          empty: false,
        },
      }),
    }),
  );
  await page.route('**/api/v1/portfolios', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }),
  );
  await page.route('**/api/v1/portfolios/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null }) }),
  );
  await page.route('**/api/v1/portfolios/simulated', async (route) => {
    createRequests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ data: { portfolioId: 42, asOfDate: '2026-11-16' } }),
    });
  });

  const assertNoHorizontalOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  };

  await page.goto('/portfolio');
  await page.getByRole('button', { name: '가상 포트폴리오 만들기' }).click();
  await assertNoHorizontalOverflow();
  await page.getByPlaceholder('예) 은퇴 준비 포트폴리오').fill('장기 투자');
  await page.getByRole('button', { name: '다음 →' }).click();

  const search = page.getByPlaceholder('티커 또는 종목명');
  await search.fill('삼성');
  await page.getByRole('button', { name: /삼성전자.*005930.*KOSPI/ }).click();
  await assertNoHorizontalOverflow();
  await page.getByRole('button', { name: '다음 →' }).click();

  await page.getByRole('slider', { name: '삼성전자 목표 비중' }).press('End');
  await assertNoHorizontalOverflow();
  await page.getByRole('button', { name: '가상 포트폴리오 생성' }).click();

  await expect(page.getByText('포트폴리오가 생성되었습니다!')).toBeVisible();
  await expect(page.getByText('2026.11.16 종가 기준')).toBeVisible();
  expect(createRequests).toEqual([{
    name: '장기 투자',
    description: '',
    totalAmount: 10_000_000,
    items: [{ symbol: '005930', targetWeight: 100 }],
  }]);
});
