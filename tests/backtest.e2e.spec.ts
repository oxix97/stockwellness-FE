import { expect, test } from './fixtures/mock-only-test';

test('백테스트 설정부터 결과까지 375px에서 primary benchmark 및 dividendReinvested 계약을 지킨다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.addInitScript(() => {
    const state = {
      memberId: 9001,
      email: 'mock@example.test',
      nickname: '모의 사용자',
      portfolioId: '1',
      accessToken: 'synthetic-token',
      refreshToken: 'synthetic-refresh',
      joinedDate: null,
      sessionEpoch: 1,
    };
    localStorage.setItem('auth-storage', JSON.stringify({ state, version: 0 }));
    localStorage.setItem('accessToken', state.accessToken);
    localStorage.setItem('refreshToken', state.refreshToken);
  });

  const requests: unknown[] = [];
  const success = (data: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data }),
  });

  await page.route('**/api/v1/members/me', (route) => route.fulfill(success({ memberId: 9001, nickname: '모의 사용자' })));
  await page.route('**/api/v1/portfolios/1/analysis/summary', (route) => route.fulfill(success({})));
  await page.route('**/api/v1/portfolios/1/health', (route) => route.fulfill(success({ categories: {}, overallScore: 0 })));
  await page.route('**/api/v1/portfolios/1', (route) => route.fulfill(success({
    portfolioId: 1,
    items: [{ symbol: '005930', name: '삼성전자', targetWeight: 100 }],
  })));
  await page.route('**/api/v1/portfolios/1/analysis/backtest', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill(success({
      dailyResults: [
        { date: '2025-01-01', totalValue: 1_000_000, totalInvested: 1_000_000, returnRate: 0, benchmarkReturnRate: 12, benchmarkReturnRates: { KOSPI: 3, KOSDAQ: 7, SP500: 12 } },
        { date: '2025-01-02', totalValue: 1_100_000, totalInvested: 1_000_000, returnRate: 10, benchmarkReturnRate: 12, benchmarkReturnRates: { KOSPI: 3, KOSDAQ: 7, SP500: 12 } },
      ],
      primaryBenchmark: 'SP500',
      cagr: null,
      xirr: 8.5,
      timeWeightedReturnRate: 9,
      calculationMethod: 'DCA_XIRR_TWR',
      mdd: -2,
      relativeMdd: -12,
      sharpeRatio: 1.2,
      sortinoRatio: null,
      recoveryPeriod: null,
      totalReturnRate: 10,
      alpha: 7,
      beta: 0.9,
      comparisons: [
        { indexName: 'KOSPI', ticker: 'KOSPI', totalReturn: 3, alpha: 1, beta: 0.1, mdd: -5, relativeMdd: -4 },
        { indexName: 'KOSDAQ', ticker: 'KOSDAQ', totalReturn: 7, alpha: 3, beta: 0.3, mdd: -9, relativeMdd: -8 },
        { indexName: 'S&P 500', ticker: 'SP500', totalReturn: 12, alpha: 7, beta: 0.9, mdd: -13, relativeMdd: -12 },
      ],
      aiComment: null,
    }));
  });

  const noHorizontalOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  };

  await page.goto('/backtest/setup');
  await expect(page.getByText('포트폴리오 시뮬레이션', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '적립식 (DCA)' }).click();
  await page.getByRole('button', { name: 'S&P500' }).click();
  await page.getByRole('switch', { name: '배당금 재투자' }).click();
  await noHorizontalOverflow();
  await page.getByRole('button', { name: '시뮬레이션 시작하기' }).click();

  const xirrCard = page.getByText('XIRR', { exact: true }).locator('..');
  await expect(xirrCard).toContainText('8.5%');
  await expect(page.getByText('연평균 복리 수익률')).toHaveCount(0);
  await expect(page.getByText('S&P500').first()).toBeVisible();
  await expect(page.getByText('Alpha · S&P500').locator('..')).toContainText('7.0%');
  await expect(page.getByText('Beta · S&P500').locator('..')).toContainText('0.90');
  await expect(page.getByText('Relative MDD').locator('..')).toContainText('12.0%');
  const chart = page.getByRole('region', { name: '백테스트 수익률 차트' });
  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();
  await page.mouse.move(chartBox!.x + chartBox!.width * 0.7, chartBox!.y + chartBox!.height * 0.55);
  await expect(page.getByText(/S&P500:/)).toBeVisible();
  await noHorizontalOverflow();
  expect(requests).toEqual([{
    strategy: 'DCA',
    amount: 10_000_000,
    primaryBenchmark: 'SP500',
    period: '1Y',
    rebalancingPeriod: 'NONE',
    dividendReinvested: false,
    weights: { '005930': 100 },
  }]);
});

const representativeDailySeries = [
  {
    date: '2025-11-18',
    totalValue: 10_000_000,
    totalInvested: 10_000_000,
    returnRate: 0,
    benchmarkReturnRate: 0,
    benchmarkReturnRates: { KOSPI: 0, KOSDAQ: 0, SP500: 0 },
  },
  {
    date: '2026-05-18',
    totalValue: 10_379_603,
    totalInvested: 10_000_000,
    returnRate: 3.796,
    benchmarkReturnRate: 13.1314,
    benchmarkReturnRates: { KOSPI: 13.1314, KOSDAQ: -9.9828, SP500: 7.8805 },
  },
  {
    date: '2026-11-13',
    totalValue: 10_840_429,
    totalInvested: 10_000_000,
    returnRate: 4.4397,
    benchmarkReturnRate: 28.6385,
    benchmarkReturnRates: { KOSPI: 28.6385, KOSDAQ: -22.3724, SP500: 15.761 },
  },
  {
    date: '2026-11-16',
    totalValue: 10_840_429,
    totalInvested: 10_000_000,
    returnRate: 0,
    benchmarkReturnRate: 28.6837,
    benchmarkReturnRates: { KOSPI: 28.6837, KOSDAQ: -21.466, SP500: 15.761 },
  },
  {
    date: '2026-11-17',
    totalValue: 8_484_175,
    totalInvested: 10_000_000,
    returnRate: -21.7358,
    benchmarkReturnRate: 29.0165,
    benchmarkReturnRates: { KOSPI: 29.0165, KOSDAQ: -21.8528, SP500: 16.3772 },
  },
];

async function setupMockAuthAndPortfolio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const state = {
      memberId: 9001,
      email: 'mock@example.test',
      nickname: '모의 사용자',
      portfolioId: '1',
      accessToken: 'synthetic-token',
      refreshToken: 'synthetic-refresh',
      joinedDate: null,
      sessionEpoch: 1,
    };
    localStorage.setItem('auth-storage', JSON.stringify({ state, version: 0 }));
    localStorage.setItem('accessToken', state.accessToken);
    localStorage.setItem('refreshToken', state.refreshToken);
  });

  const success = (data: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data }),
  });

  await page.route('**/api/v1/members/me', (route) => route.fulfill(success({ memberId: 9001, nickname: '모의 사용자' })));
  await page.route('**/api/v1/portfolios/1/analysis/summary', (route) => route.fulfill(success({})));
  await page.route('**/api/v1/portfolios/1/health', (route) => route.fulfill(success({ categories: {}, overallScore: 0 })));
  await page.route('**/api/v1/portfolios/1', (route) => route.fulfill(success({
    portfolioId: 1,
    items: [{ symbol: '964001', name: '테스트종목', targetWeight: 100 }],
  })));
}

test('360px 거치식(LUMP_SUM)+KOSPI 차트 툴팁은 11/13·11/17에 일간 TWR이 아닌 복리 누적 수익률과 CAGR을 표시한다', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await setupMockAuthAndPortfolio(page);

  await page.route('**/api/v1/portfolios/1/analysis/backtest', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          dailyResults: representativeDailySeries,
          primaryBenchmark: 'KOSPI',
          cagr: -15.1966,
          xirr: null,
          timeWeightedReturnRate: -15.1582,
          calculationMethod: 'LUMP_SUM_CAGR_TWR',
          mdd: 21.7358,
          relativeMdd: 19.7457,
          sharpeRatio: 0,
          sortinoRatio: 0,
          recoveryPeriod: null,
          totalReturnRate: -15.1582,
          alpha: -44.1748,
          beta: -0.0329,
          comparisons: [
            { indexName: '코스피', ticker: 'KOSPI', totalReturn: 29.0165, alpha: -44.1748, beta: -0.0329, mdd: 1.9901, relativeMdd: 19.7457 },
            { indexName: '코스닥', ticker: 'KOSDAQ', totalReturn: -21.8528, alpha: 6.6945, beta: 0.0229, mdd: 22.7737, relativeMdd: -1.0379 },
            { indexName: 'S&P 500', ticker: 'SP500', totalReturn: 16.3772, alpha: -31.5355, beta: -0.0123, mdd: 6.3878, relativeMdd: 15.348 },
          ],
          aiComment: null,
        },
      }),
    });
  });

  await page.goto('/backtest/setup');
  await page.getByRole('button', { name: '시뮬레이션 시작하기' }).click();

  await expect(page.getByText('10,000,000원이')).toBeVisible();
  await expect(page.getByText('₩ 8,484,175')).toBeVisible();
  await expect(page.getByText('되었을 거예요!')).toBeVisible();
  await expect(page.getByText(/월 적립액/)).toHaveCount(0);
  await expect(page.getByText('CAGR', { exact: true }).locator('..')).toContainText('▼ 15.2%');
  await expect(page.getByText('XIRR', { exact: true })).toHaveCount(0);

  const chart = page.getByRole('region', { name: '백테스트 수익률 차트' });
  await chart.scrollIntoViewIfNeeded();
  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();

  // 중간 지점(11/13): 포트폴리오 누적 ▲ 8.4%, KOSPI ▲ 28.6%
  await page.mouse.move(chartBox!.x + chartBox!.width * 0.5, chartBox!.y + chartBox!.height * 0.65);
  await expect(chart.getByText('Nov 13')).toBeVisible();
  await expect(chart.getByText(/내 포트폴리오:/)).toContainText('▲ 8.4%');
  await expect(chart.getByText(/KOSPI:/)).toContainText('▲ 28.6%');

  // 마지막 지점(11/17): 일간 ▼ 21.7%가 아니라 기간 누적 ▼ 15.2%, KOSPI ▲ 29.0%
  await page.mouse.move(chartBox!.x + chartBox!.width - 36, chartBox!.y + chartBox!.height * 0.65);
  await expect(chart.getByText('Nov 17')).toBeVisible();
  await expect(chart.getByText(/내 포트폴리오:/)).toContainText('▼ 15.2%');
  await expect(chart.getByText(/내 포트폴리오:/)).not.toContainText('21.7%');
  await expect(chart.getByText(/KOSPI:/)).toContainText('▲ 29.0%');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('390px 적립식(DCA)+KOSDAQ 차트 툴팁은 11/17 복리 누적 수익률(▼ 15.2%)·음수 벤치마크(▼ 21.9%)·XIRR(▼ 31.7%)을 표시한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockAuthAndPortfolio(page);

  await page.route('**/api/v1/portfolios/1/analysis/backtest', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          dailyResults: representativeDailySeries.map((item, idx) => ({
            ...item,
            totalInvested: idx === 4 ? 130_000_000 : (idx + 1) * 10_000_000,
            totalValue: idx === 4 ? 106_498_577 : item.totalValue * (idx + 1),
            benchmarkReturnRate: item.benchmarkReturnRates.KOSDAQ,
          })),
          primaryBenchmark: 'KOSDAQ',
          cagr: null,
          xirr: -31.707,
          timeWeightedReturnRate: -15.1582,
          calculationMethod: 'DCA_XIRR_TWR',
          mdd: 21.7358,
          relativeMdd: -1.0379,
          sharpeRatio: 0,
          sortinoRatio: 0,
          recoveryPeriod: null,
          totalReturnRate: -15.1582,
          alpha: 6.6945,
          beta: 0.0229,
          comparisons: [
            { indexName: '코스닥', ticker: 'KOSDAQ', totalReturn: -21.8528, alpha: 6.6945, beta: 0.0229, mdd: 22.7737, relativeMdd: -1.0379 },
            { indexName: '코스피', ticker: 'KOSPI', totalReturn: 29.0165, alpha: -44.1748, beta: -0.0329, mdd: 1.9901, relativeMdd: 19.7457 },
            { indexName: 'S&P 500', ticker: 'SP500', totalReturn: 16.3772, alpha: -31.5355, beta: -0.0123, mdd: 6.3878, relativeMdd: 15.348 },
          ],
          aiComment: null,
        },
      }),
    });
  });

  await page.goto('/backtest/setup');
  await page.getByRole('button', { name: '적립식 (DCA)' }).click();
  await page.getByRole('button', { name: 'KOSDAQ' }).click();
  await page.getByRole('button', { name: '시뮬레이션 시작하기' }).click();

  await expect(page.getByText('월 적립액 10,000,000원')).toBeVisible();
  await expect(page.getByText('총 납입액 130,000,000원')).toBeVisible();
  await expect(page.getByText('최종 평가액', { exact: true })).toBeVisible();
  await expect(page.getByText('₩ 106,498,577')).toBeVisible();
  await expect(page.getByText('10,000,000원이')).toHaveCount(0);
  await expect(page.getByText('되었을 거예요!')).toHaveCount(0);
  await expect(page.getByText('XIRR', { exact: true }).locator('..')).toContainText('▼ 31.7%');
  await expect(page.getByText('CAGR', { exact: true })).toHaveCount(0);

  const chart = page.getByRole('region', { name: '백테스트 수익률 차트' });
  await chart.scrollIntoViewIfNeeded();
  const chartBox = await chart.boundingBox();
  expect(chartBox).not.toBeNull();

  await page.mouse.move(chartBox!.x + chartBox!.width - 36, chartBox!.y + chartBox!.height * 0.65);
  await expect(chart.getByText('Nov 17')).toBeVisible();
  await expect(chart.getByText(/내 포트폴리오:/)).toContainText('▼ 15.2%');
  await expect(chart.getByText(/내 포트폴리오:/)).not.toContainText('21.7%');
  await expect(chart.getByText(/내 포트폴리오:/)).not.toContainText('18.1%');
  await expect(chart.getByText(/KOSDAQ:/)).toContainText('▼ 21.9%');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
