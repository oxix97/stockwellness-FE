import { test, expect } from './fixtures/mock-only-test';

const mockAccessToken = [
  Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: '1', email: 'test@example.com', nickname: '테스터' })).toString('base64url'),
  'mock-signature',
].join('.');

test.describe('Social Login (OAuth2) E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/members/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            memberId: 1,
            email: 'test@example.com',
            nickname: '테스터',
          },
        }),
      });
    });

    // 모든 테스트 전에 로컬 스토리지를 초기화합니다.
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('E2E-00: Login Page Loads Without Real API Requests', async ({ page }) => {
    await expect(page.getByText('카카오로 시작하기')).toBeVisible();
  });

  test('E2E-01: Kakao Login Success Flow (Mocked Backend)', async ({ page }) => {
    // 1. 로그인 페이지 접속 및 카카오 버튼 클릭
    await page.goto('/login');
    const kakaoButton = page.getByText('카카오로 시작하기');
    await expect(kakaoButton).toBeVisible();

    // 2. 실제 OAuth 제공자 대신 현재 앱의 콜백 계약을 mock한다.
    await page.route('**/oauth2/authorization/kakao', route => {
      route.fulfill({
        status: 302,
        headers: {
          Location: '/auth/callback?code=mock-one-time-code',
        },
      });
    });

    await page.route('**/api/v1/auth/exchange', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            memberId: 1,
            email: 'test@example.com',
            nickname: '테스터',
            accessToken: mockAccessToken,
            refreshToken: 'mock-refresh-token',
            joinedDate: null,
          },
        }),
      });
    });

    // 3. 로그인 직후 포트폴리오 동기화도 mock한다.
    await page.route('**/api/v1/portfolios', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    // 4. 로그인 버튼 클릭 실행
    await kakaoButton.click();

    // 5. 검증: 최종적으로 메인 페이지로 이동했는지 확인
    await page.waitForURL('/portfolio');
    await expect(page).toHaveURL(/\/portfolio$/);
    
    // 6. 검증: 웰컴 메시지 토스트 확인 (sonner)
    await expect(page.getByText('테스터님, 환영합니다!')).toBeVisible();

    // 7. 검증: 로컬 스토리지에 토큰이 저장되었는지 확인
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBe(mockAccessToken);
  });

  test('E2E-02: Missing Callback Credentials', async ({ page }) => {
    await page.goto('/auth/callback');

    await expect(page.getByText('로그인 처리에 실패했습니다. 다시 시도해주세요.')).toBeVisible();

    // 3. 검증: 다시 로그인 페이지로 튕겼는지 확인
    await page.waitForURL('/login');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('E2E-03: Handle OAuth Callback Error', async ({ page }) => {
    await page.goto('/auth/callback?errorCode=A007');

    await expect(page.getByText('소셜 로그인에 실패했습니다. 다시 시도해주세요.')).toBeVisible();

    // 3. 검증: 다시 로그인 페이지로 복귀했는지 확인
    await page.waitForURL('/login');
  });

  test('E2E-04: Automatic Token Reissue and Retry on 401 Error', async ({ page }) => {
    // 1. 이미 로그인된 상태로 설정 (만료된 토큰)
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'expired_token');
      localStorage.setItem('refreshToken', 'valid_refresh_token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          memberId: 1,
          email: 'test@example.com',
          nickname: '테스터',
          portfolioId: '1',
          accessToken: 'expired_token',
          refreshToken: 'valid_refresh_token',
          joinedDate: null,
        },
        version: 0,
      }));
    });

    // 2. 보호된 API 요청 시 401 에러 유도 (예: 포트폴리오 조회)
    let callCount = 0;
    await page.route('**/api/v1/portfolios/**', route => {
      callCount++;
      if (callCount === 1) {
        // 첫 번째 호출: 401 만료 에러 반환
        route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }) });
      } else {
        // 두 번째 호출: 성공 응답 반환
        route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, name: 'My Portfolio' }]) });
      }
    });

    await page.route('**/api/v1/members/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            memberId: 1,
            email: 'test@example.com',
            nickname: '테스터',
          },
        }),
      });
    });

    // 3. Reissue API Mocking (새 토큰 발급)
    await page.route('**/api/v1/auth/reissue', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: { accessToken: 'new_access_token', refreshToken: 'new_refresh_token' },
        })
      });
    });

    const reissueRequest = page.waitForRequest(req => req.url().includes('/auth/reissue'));
    const retriedPortfolioResponse = page.waitForResponse(
      res => res.url().includes('/portfolios') && res.status() === 200
    );

    // 4. 보호 화면으로 이동하여 API 호출 발생
    await page.goto('/portfolio');

    // 5. 검증: Reissue API가 한 번 호출되었는지 확인
    await reissueRequest;
    
    // 6. 검증: 원래 요청이 새 토큰(new_access_token)으로 재시도되었는지 확인
    await retriedPortfolioResponse;
    
    // 7. 검증: 로컬 스토리지에 새 토큰이 반영되었는지 확인
    const newToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(newToken).toBe('new_access_token');
  });
});

type LoginFixture = {
  memberId: number;
  email: string;
  nickname: string;
  accessToken: string;
  refreshToken: string;
  joinedDate: string;
};

function createUser(memberId: number, nickname: string): LoginFixture {
  return {
    memberId,
    email: `member-${memberId}@example.com`,
    nickname,
    accessToken: crypto.randomUUID(),
    refreshToken: crypto.randomUUID(),
    joinedDate: '2026-08-10',
  };
}

function success(data: unknown) {
  return JSON.stringify({
    success: true,
    status: 200,
    code: 'S001',
    message: '성공',
    data,
    timestamp: '2026-08-10T00:00:00Z',
  });
}

test.describe('OAuth 교환과 사용자 캐시 격리', () => {
  test('사용자 A 로그아웃 뒤 사용자 B 로그인은 A의 member cache를 재사용하지 않는다', async ({ page }) => {
    const memberRequestAuthors: string[] = [];
    const userA = createUser(101, '사용자 A');
    const userB = createUser(202, '사용자 B');

    await page.route('**/api/v1/auth/exchange', async (route) => {
      const request = route.request().postDataJSON() as { code: string };
      const member = request.code === 'mock-one-time-code-a' ? userA : userB;
      await route.fulfill({ status: 200, contentType: 'application/json', body: success(member) });
    });
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: success(null) });
    });
    await page.route('**/api/v1/portfolios', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: success([]) });
    });
    await page.route('**/api/v1/members/me', async (route) => {
      const authorization = route.request().headers().authorization ?? '';
      memberRequestAuthors.push(authorization);
      const profile = authorization.includes(userB.accessToken)
        ? { ...userB, riskLevel: 'MEDIUM', status: 'ACTIVE' }
        : { ...userA, riskLevel: 'MEDIUM', status: 'ACTIVE' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: success(profile) });
    });

    await page.goto('/auth/callback?code=mock-one-time-code-a');
    await page.waitForURL('**/portfolio');
    await expect.poll(() => memberRequestAuthors).toContain(`Bearer ${userA.accessToken}`);

    await page.goto('/more');
    await page.getByRole('button', { name: /로그아웃/ }).click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();

    await page.goto('/auth/callback?code=mock-one-time-code-b');
    await page.waitForURL('**/portfolio');
    await expect.poll(() => memberRequestAuthors).toContain(`Bearer ${userB.accessToken}`);

    await page.goto('/more');
    await expect(page.getByText('사용자 B님의', { exact: false })).toBeVisible();
  });
});
