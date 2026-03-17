import { test, expect } from '@playwright/test';

const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJpZWVqbzcxNkBuYXZlci5jb20iLCJsb2dpblR5cGUiOiJLQUtBTyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzczNzMwNjE3LCJleHAiOjE3NzM3MzQyMTd9.HwL9V3iMjOcLYQRvgHZwnJQElLgX97nq4wK_cK96ifc';

test.describe('Real API Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 실제 토큰을 로컬 스토리지에 주입
    await page.goto('http://localhost:5173/login');
    await page.evaluate((token) => {
      localStorage.clear();
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', 'dummy_refresh_token');
      const authData = {
        state: {
          memberId: 1,
          email: 'ieejo716@naver.com',
          nickname: '테스터',
          portfolioId: '1',
          accessToken: token
        },
        version: 0
      };
      localStorage.setItem('auth-storage', JSON.stringify(authData));
    }, REAL_TOKEN);
    await page.waitForTimeout(500);
  });

  test('실제 서버: 추천 섹터 데이터 조회 확인', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // 로딩 스켈레톤이 사라질 때까지 대기
    await page.waitForSelector('.bg-card:has-text("AI 의견")', { state: 'visible', timeout: 15000 }).catch(() => {
        console.log('추천 섹터 데이터를 찾을 수 없거나 로딩이 지연되고 있습니다.');
    });

    // 화면에 최소 하나 이상의 섹터명이 나타나는지 확인 (바이오, 반도체 등 실제 DB 데이터)
    const sectors = page.locator('.bg-card:has-text("AI 의견")');
    const count = await sectors.count();
    console.log(`실제 서버에서 가져온 추천 섹터 수: ${count}`);
    
    if (count > 0) {
      await expect(sectors.first()).toBeVisible();
    } else {
      await expect(page.getByText('현재 추천 섹터가 없습니다.')).toBeVisible();
    }
  });

  test('실제 서버: 포트폴리오 가치 분석 데이터 조회 확인', async ({ page }) => {
    await page.goto('http://localhost:5173/portfolio');
    
    // API 응답을 기다림 (명세서에 있는 /analysis/valuation)
    const response = await page.waitForResponse(res => res.url().includes('/analysis/valuation'), { timeout: 15000 });
    const status = response.status();
    const data = await response.json();
    
    console.log(`Valuation API 응답 상태: ${status}`);
    console.log(`가져온 가치 분석 데이터: ${JSON.stringify(data)}`);

    if (status === 200) {
      // 총 평가 금액이 화면에 보이는지 확인
      await expect(page.getByText('내 포트폴리오 총 평가금액')).toBeVisible();
    } else if (status === 401) {
      console.error('토큰이 만료되었거나 유효하지 않습니다.');
      throw new Error('Unauthorized');
    }
  });

  test('실제 서버: 관심 종목 데이터 조회 확인', async ({ page }) => {
    await page.goto('http://localhost:5173/watchlist');
    
    // 그룹 목록 API 응답 대기 (명세서의 /v1/watchlist/groups)
    const groupRes = await page.waitForResponse(res => res.url().includes('/watchlist/groups'), { timeout: 15000 });
    const groups = await groupRes.json();
    console.log(`가져온 관심 종목 그룹: ${JSON.stringify(groups)}`);

    if (groups.length > 0) {
      await expect(page.getByText(groups[0].name)).toBeVisible();
    }
  });
});
