import { test, expect } from '@playwright/test';

test.describe('Stock Search E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. 페이지 로드 전 localStorage 미리 설정 (addInitScript)
    await page.addInitScript(() => {
      const authData = { 
        state: { 
          memberId: 1,
          email: 'test@example.com',
          nickname: '테스터',
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token'
        } 
      };
      window.localStorage.setItem('accessToken', 'mock_access_token');
      window.localStorage.setItem('refreshToken', 'mock_refresh_token');
      window.localStorage.setItem('auth-storage', JSON.stringify(authData));
    });

    // 2. 검색 페이지로 직접 이동 (로그인 페이지 리다이렉트 방지)
    await page.goto('/search');
  });

  test('E2E-SEARCH-01: 인기 검색어 목록 조회 및 키워드 선택', async ({ page }) => {
    // 1. 인기 검색어 API 모킹
    await page.route('**/api/v1/stocks/popular', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: ["삼성전자", "SK하이닉스", "에코프로", "현대차", "카카오"]
        })
      });
    });

    // 2. 검색 페이지 접속
    await page.goto('/search');

    // 3. 인기 검색어 섹션 확인
    await expect(page.getByText('인기 검색어')).toBeVisible();
    await expect(page.getByText('삼성전자')).toBeVisible();
    await expect(page.getByText('SK하이닉스')).toBeVisible();

    // 4. 인기 검색어 클릭 시 검색창에 입력되는지 확인
    await page.getByText('삼성전자').click();
    const searchInput = page.getByPlaceholder('종목명 또는 종목코드 검색');
    await expect(searchInput).toHaveValue('삼성전자');
  });

  test('E2E-SEARCH-02: 검색어 입력 및 결과 리스트 확인', async ({ page }) => {
    // 1. 검색 API 모킹
    await page.route('**/api/v1/stocks/search?keyword=삼성*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              { ticker: "005930", name: "삼성전자", marketType: "KOSPI", sectorName: "전기전자", status: "ACTIVE" },
              { ticker: "006400", name: "삼성SDI", marketType: "KOSPI", sectorName: "전기전자", status: "ACTIVE" },
              { ticker: "028260", name: "삼성물산", marketType: "KOSPI", sectorName: "유통업", status: "ACTIVE" }
            ],
            number: 0,
            size: 20,
            numberOfElements: 3,
            last: true,
            first: true,
            hasNext: false,
            empty: false
          }
        })
      });
    });

    // 2. 검색어 입력
    const searchInput = page.getByPlaceholder('종목명 또는 종목코드 검색');
    await searchInput.fill('삼성');

    // 3. 검색 결과 노출 확인
    await expect(page.getByText('삼성전자')).toBeVisible();
    await expect(page.getByText('삼성SDI')).toBeVisible();
    await expect(page.getByText('005930')).toBeVisible();

    // 4. 결과 클릭 시 상세 페이지 이동 확인
    await page.getByText('삼성전자').first().click();
    await expect(page).toHaveURL(/\/stock\/005930/);
  });

  test('E2E-SEARCH-03: 검색 결과가 없는 경우 처리', async ({ page }) => {
    // 1. 빈 결과 반환 모킹
    await page.route('**/api/v1/stocks/search?keyword=없는종목*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [],
            number: 0,
            size: 20,
            numberOfElements: 0,
            last: true,
            first: true,
            hasNext: false,
            empty: true
          }
        })
      });
    });

    // 2. 존재하지 않는 검색어 입력
    const searchInput = page.getByPlaceholder('종목명 또는 종목코드 검색');
    await searchInput.fill('없는종목');

    // 3. 결과 없음 UI 확인
    await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
  });

  test('E2E-SEARCH-04: API 에러 발생 시 처리', async ({ page }) => {
    // 1. 500 에러 모킹
    await page.route('**/api/v1/stocks/search?keyword=에러*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          status: 500,
          code: "SERVER_ERROR",
          message: "서버 오류가 발생했습니다."
        })
      });
    });

    // 2. 검색어 입력
    const searchInput = page.getByPlaceholder('종목명 또는 종목코드 검색');
    await searchInput.fill('에러');

    // 3. 에러 UI 확인
    await expect(page.getByText('검색 데이터를 가져오지 못했어요')).toBeVisible();
  });
});
