# 테스트 작성 가이드

> 단위/컴포넌트 테스트: **Vitest** · E2E 테스트: **Playwright**
> 테스트 파일 위치: 대상 코드 옆 `__tests__/` 서브디렉토리 · E2E는 `tests/`

---

## 단위 테스트 (Vitest)

### API 훅 테스트 — `vi.mock` 패턴

API 모듈 전체를 모킹한 뒤, 훅의 동작(로딩·성공·에러 상태)을 검증합니다.

```ts
// src/hooks/__tests__/use-portfolio.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createWrapper } from '@/test/utils'; // QueryClient 래퍼
import { usePortfolio, useCreatePortfolio } from '../use-portfolio';
import * as portfolioApi from '@/api/portfolioApi';

// API 모듈 전체 모킹
vi.mock('@/api/portfolioApi');

const mockPortfolio = {
  id: 1,
  name: '테스트 포트폴리오',
  description: '설명',
  totalPurchaseAmount: 1000000,
  items: [],
};

describe('usePortfolio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('포트폴리오를 정상적으로 조회한다', async () => {
    vi.mocked(portfolioApi.getPortfolioById).mockResolvedValue(mockPortfolio);

    const { result } = renderHook(() => usePortfolio(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPortfolio);
  });

  it('id가 없으면 쿼리를 실행하지 않는다', () => {
    const { result } = renderHook(() => usePortfolio(0), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('API 오류 시 에러 상태를 반환한다', async () => {
    vi.mocked(portfolioApi.getPortfolioById).mockRejectedValue(
      new Error('서버 오류')
    );

    const { result } = renderHook(() => usePortfolio(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreatePortfolio', () => {
  it('생성 성공 후 목록 캐시를 무효화한다', async () => {
    vi.mocked(portfolioApi.createPortfolio).mockResolvedValue(100);

    const { result } = renderHook(() => useCreatePortfolio(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: '새 포트폴리오',
      description: '설명',
      items: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

### Auth 스토어 모킹

```ts
// auth 스토어를 모킹할 때
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      memberId: 1,
      email: 'test@example.com',
      nickname: 'tester',
      portfolioId: 1,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    })
  ),
}));
```

### 테스트 유틸 (`src/test/utils.tsx`)

```tsx
// QueryClient를 테스트용으로 설정하는 래퍼
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },      // 테스트에서 재시도 비활성화
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### API 모듈 단위 테스트

```ts
// src/api/__tests__/portfolioApi.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { axiosClient } from '@/api/client';
import { getPortfolios, createPortfolio } from '@/api/portfolioApi';

vi.mock('@/api/client', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('portfolioApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getPortfolios — 정상 응답에서 data.data를 반환한다', async () => {
    const mockData = [{ id: 1, name: '포트폴리오', description: '', totalPurchaseAmount: 0, items: [] }];
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: mockData } });

    const result = await getPortfolios();

    expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/portfolios');
    expect(result).toEqual(mockData);
  });

  it('createPortfolio — 생성된 portfolioId를 반환한다', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { data: 100 } });

    const result = await createPortfolio({ name: '테스트', description: '', items: [] });

    expect(result).toBe(100);
  });
});
```

---

## E2E 테스트 (Playwright)

### OAuth 로그인 모킹

```ts
// tests/auth.e2e.spec.ts
import { test, expect } from '@playwright/test';

const MOCK_LOGIN_RESPONSE = {
  success: true,
  status: 200,
  code: 'S000',
  message: '요청이 성공적으로 처리되었습니다.',
  data: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    memberId: 1,
    email: 'test@example.com',
    nickname: 'tester',
    joinedDate: '2026-01-01',
  },
  timestamp: new Date().toISOString(),
  traceId: null,
  errors: [],
};

test.beforeEach(async ({ page }) => {
  // POST /api/v1/auth/login 인터셉트
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'service/json',
      body: JSON.stringify(MOCK_LOGIN_RESPONSE),
    })
  );
});

test('로그인 후 포트폴리오 화면으로 이동한다', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /Google로 로그인/ }).click();

  await expect(page).toHaveURL('/portfolio');
  await expect(page.getByText('tester')).toBeVisible();
});
```

### API 응답 모킹

```ts
// tests/portfolio.e2e.spec.ts
import { test, expect } from '@playwright/test';

const MOCK_PORTFOLIOS = {
  success: true,
  status: 200,
  code: 'S000',
  message: '요청이 성공적으로 처리되었습니다.',
  data: [
    {
      id: 1,
      name: '내 연금 포트폴리오',
      description: '은퇴 자금 마련용',
      totalPurchaseAmount: 1000000,
      items: [],
    },
  ],
  timestamp: new Date().toISOString(),
  traceId: null,
  errors: [],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/portfolios', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'service/json',
        body: JSON.stringify(MOCK_PORTFOLIOS),
      });
    } else {
      route.continue();
    }
  });
});

test('포트폴리오 목록이 올바르게 표시된다', async ({ page }) => {
  await page.goto('/portfolio');

  await expect(page.getByText('내 연금 포트폴리오')).toBeVisible();
  await expect(page.getByText('은퇴 자금 마련용')).toBeVisible();
});
```

### 에러 응답 모킹

```ts
test('API 오류 시 에러 메시지가 표시된다', async ({ page }) => {
  await page.route('**/api/v1/portfolios', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'service/json',
      body: JSON.stringify({
        success: false,
        status: 500,
        code: 'E500',
        message: '서버 오류가 발생했습니다.',
        data: null,
        timestamp: new Date().toISOString(),
        traceId: null,
        errors: [],
      }),
    })
  );

  await page.goto('/portfolio');
  await expect(page.getByText('오류가 발생했습니다')).toBeVisible();
});
```

---

## 테스트 작성 체크리스트

### 단위 테스트
- [ ] 성공 케이스 (정상 응답)
- [ ] 실패 케이스 (API 에러, 네트워크 에러)
- [ ] 조건부 실행 (`enabled: !!id` 등)
- [ ] mutation 성공 후 캐시 무효화 확인

### E2E 테스트
- [ ] 모든 API 호출을 `page.route`로 인터셉트
- [ ] 서버 응답은 실제 Swagger 예시와 동일한 envelope 구조 사용
- [ ] 인증이 필요한 테스트는 localStorage에 토큰 직접 주입

```ts
// E2E에서 인증 상태 주입
await page.evaluate(() => {
  localStorage.setItem('auth-storage', JSON.stringify({
    state: {
      accessToken: 'mock-token',
      memberId: 1,
      email: 'test@example.com',
      nickname: 'tester',
      portfolioId: 1,
      refreshToken: 'mock-refresh',
    },
  }));
});
```
