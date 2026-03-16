import { test, expect } from '@playwright/test';

test.describe('Social Login (OAuth2) E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 모든 테스트 전에 로컬 스토리지를 초기화합니다.
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('E2E-01: Kakao Login Success Flow (Mocked Backend)', async ({ page }) => {
    // 1. 로그인 페이지 접속 및 카카오 버튼 클릭
    await page.goto('/login');
    const kakaoButton = page.getByText('카카오로 시작하기');
    await expect(kakaoButton).toBeVisible();

    // 2. 버튼 클릭 시 백엔드 인가 URL로 리다이렉트 되는지 확인 (네트워크 요청 가로채기)
    await page.route('**/api/v1/auth/authorize/kakao*', route => {
      const url = new URL(route.request().url());
      const state = url.searchParams.get('state');
      // 실제 카카오 리다이렉트 대신 우리 서비스의 콜백으로 직접 리다이렉트 시뮬레이션
      route.fulfill({
        status: 302,
        headers: { Location: `/auth/kakao/callback?code=mock_code&state=${state}` }
      });
    });

    // 3. 백엔드 로그인 API 응답 Mocking
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          memberId: 1,
          email: 'test@example.com',
          nickname: '테스터',
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token'
        })
      });
    });

    // 4. 로그인 버튼 클릭 실행
    await kakaoButton.click();

    // 5. 검증: 최종적으로 메인 페이지로 이동했는지 확인
    await page.waitForURL('/');
    await expect(page).toHaveURL('http://localhost:5173/');
    
    // 6. 검증: 웰컴 메시지 토스트 확인 (sonner)
    await expect(page.getByText('테스터님, 환영합니다!')).toBeVisible();

    // 7. 검증: 로컬 스토리지에 토큰이 저장되었는지 확인
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBe('mock_access_token');
  });

  test('E2E-02: CSRF Security Validation Failure', async ({ page }) => {
    // 1. 직접 잘못된 state를 가진 콜백 URL로 접근
    await page.goto('/auth/kakao/callback?code=some_code&state=wrong_state');

    // 2. 검증: 보안 에러 토스트 확인
    await expect(page.getByText('보안 검증에 실패했습니다. 다시 시도해 주세요.')).toBeVisible();

    // 3. 검증: 다시 로그인 페이지로 튕겼는지 확인
    await page.waitForURL('/login');
    await expect(page).toHaveURL('http://localhost:5173/login');
  });

  test('E2E-03: Handle Backend API Error during Callback', async ({ page }) => {
    // 1. 로그인 페이지에서 정상적으로 시작하여 state를 로컬스토리지에 생성하게 함
    await page.goto('/login');
    
    // 버튼 클릭 시 state를 생성하고 리다이렉트되는 과정 가로채기
    let capturedState: string | null = null;
    await page.route('**/api/v1/auth/authorize/kakao*', route => {
      capturedState = new URL(route.request().url()).searchParams.get('state');
      route.fulfill({
        status: 302,
        headers: { Location: `/auth/kakao/callback?code=error_code&state=${capturedState}` }
      });
    });

    // 백엔드 로그인 API에서 에러 반환 Mocking
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });

    await page.getByText('카카오로 시작하기').click();

    // 2. 검증: 에러 발생 알림 확인
    await expect(page.getByText('로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')).toBeVisible();

    // 3. 검증: 다시 로그인 페이지로 복귀했는지 확인
    await page.waitForURL('/login');
  });

  test('E2E-04: Automatic Token Reissue and Retry on 401 Error', async ({ page }) => {
    // 1. 이미 로그인된 상태로 설정 (만료된 토큰)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'expired_token');
      localStorage.setItem('refreshToken', 'valid_refresh_token');
      localStorage.setItem('auth-storage', JSON.stringify({ state: { nickname: '테스터', accessToken: 'expired_token' } }));
    });

    // 2. 보호된 API 요청 시 401 에러 유도 (예: 포트폴리오 조회)
    let callCount = 0;
    await page.route('**/api/v1/portfolios*', route => {
      callCount++;
      if (callCount === 1) {
        // 첫 번째 호출: 401 만료 에러 반환
        route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) });
      } else {
        // 두 번째 호출: 성공 응답 반환
        route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, name: 'My Portfolio' }]) });
      }
    });

    // 3. Reissue API Mocking (새 토큰 발급)
    await page.route('**/api/v1/auth/reissue', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ accessToken: 'new_access_token', refreshToken: 'new_refresh_token' })
      });
    });

    // 4. 페이지 새로고침하여 API 호출 발생
    await page.goto('/portfolio');

    // 5. 검증: Reissue API가 한 번 호출되었는지 확인
    await page.waitForRequest(req => req.url().includes('/auth/reissue'));
    
    // 6. 검증: 원래 요청이 새 토큰(new_access_token)으로 재시도되었는지 확인
    await page.waitForResponse(res => res.url().includes('/portfolios') && res.status() === 200);
    
    // 7. 검증: 로컬 스토리지에 새 토큰이 반영되었는지 확인
    const newToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(newToken).toBe('new_access_token');
  });
});
