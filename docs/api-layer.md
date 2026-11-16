# API 레이어 가이드

> 규칙: `타입 → api 함수 + Query Key → 커스텀 훅`
> 컴포넌트는 **오직 `src/hooks/`** 만 사용. `src/api/`를 직접 import 금지.

---

## 계층 개요

```
[ 컴포넌트 / 화면 ]
        ↓  (훅만 호출)
[ src/hooks/use-*.ts ]         TanStack Query useQuery / useMutation
        ↓
[ src/api/[domain]Api.ts ]     순수 Axios 호출 함수 + Query Key 팩토리
        ↓
[ src/api/client.ts ]          Axios 인스턴스 (인터셉터 포함)
        ↓
[ 백엔드 API ]
```

---

## 1단계 — 타입 정의 (`src/types/`)

```ts
// 규칙
// - 객체 모델, DTO → interface
// - 유니언, 유틸리티, 함수 타입 → type
// - any 사용 금지 — 불명확하면 unknown + 타입 가드
// - 모든 API 응답은 ApiEnvelope<T>로 감쌀 것 (인터셉터가 .data.data 언래핑)

// src/types/api.ts — 공통 envelope
export interface ApiEnvelope<T> {
  success: boolean;
  status: number;
  code: string;
  message: string;
  data: T;
  timestamp: string;
  traceId: string | null;
  errors: unknown[];
}

// 실제 타입은 docs/api-spec.md 참고
```

---

## 2단계 — API 모듈 (`src/api/[domain]Api.ts`)

```ts
// src/api/portfolioApi.ts 작성 패턴

import { axiosClient } from './client';
import type { ApiEnvelope } from '@/types/api';
import type { PortfolioSummary, CreatePortfolioRequest } from '@/types/portfolio';

// ── Query Key 팩토리 (이 파일 상단에 함께 정의) ──
export const portfolioKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  detail: (id: number) => [...portfolioKeys.all, 'detail', id] as const,
  health: (id: number) => [...portfolioKeys.all, 'health', id] as const,
  advice: (id: number) => [...portfolioKeys.all, 'advice', id] as const,
  analysis: {
    backtest: (id: number) => [...portfolioKeys.all, 'analysis', 'backtest', id] as const,
    correlation: (id: number) => [...portfolioKeys.all, 'analysis', 'correlation', id] as const,
    diversification: (id: number) => [...portfolioKeys.all, 'analysis', 'diversification', id] as const,
    rebalancing: (id: number) => [...portfolioKeys.all, 'analysis', 'rebalancing', id] as const,
    valuation: (id: number) => [...portfolioKeys.all, 'analysis', 'valuation', id] as const,
  },
};

// ── API 함수 ──
export const getPortfolios = async (): Promise<PortfolioSummary[]> => {
  const { data } = await axiosClient.get<ApiEnvelope<PortfolioSummary[]>>('/api/v1/portfolios');
  return data.data;
};

export const createPortfolio = async (
  body: CreatePortfolioRequest
): Promise<number> => {
  const { data } = await axiosClient.post<ApiEnvelope<number>>('/api/v1/portfolios', body);
  return data.data;
};
```

### Query Key 규칙

```ts
// ✅ 올바른 사용
queryKey: portfolioKeys.detail(id)

// ❌ 절대 금지 — 하드코딩
queryKey: ['portfolios', 'detail', id]
```

---

## 3단계 — 커스텀 훅 (`src/hooks/use-[domain].ts`)

```ts
// src/hooks/use-portfolio.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  portfolioKeys,
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  deletePortfolio,
} from '@/api/portfolioApi';

// ── useQuery 패턴 ──
export const usePortfolios = () =>
  useQuery({
    queryKey: portfolioKeys.lists(),
    queryFn: getPortfolios,
  });

export const usePortfolio = (id: number) =>
  useQuery({
    queryKey: portfolioKeys.detail(id),
    queryFn: () => getPortfolioById(id),
    enabled: !!id,  // id가 없으면 실행 안 함
  });

// ── useMutation 패턴 ──
export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePortfolio(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });
      queryClient.removeQueries({ queryKey: portfolioKeys.detail(id) });
    },
  });
};
```

---

## 컴포넌트에서 사용

```tsx
// src/app/components/screens/PortfolioScreen.tsx
// ✅ hooks만 import
import { usePortfolios, useCreatePortfolio } from '@/hooks/use-portfolio';

// ❌ 절대 금지
// import { getPortfolios } from '@/api/portfolioApi';
// import { axiosClient } from '@/api/client';

export const PortfolioScreen = () => {
  const { data, isLoading, isError } = usePortfolios();
  const { mutate: create, isPending } = useCreatePortfolio();

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage />;

  return (
    <>
      {data?.map((p) => <PortfolioCard key={p.id} portfolio={p} />)}
      <button disabled={isPending}
        onClick={() => create({ name: '새 포트폴리오', description: '', items: [] })}>
        추가
      </button>
    </>
  );
};
```

---

## 도메인별 API 파일 목록

| 파일 | 담당 도메인 | 주요 엔드포인트 |
|---|---|---|
| `src/api/authApi.ts` | 인증 | 로그인, 로그아웃, 토큰 재발급 |
| `src/api/portfolioApi.ts` | 포트폴리오 | CRUD, 건강진단, AI 조언, 분석 5종 |
| `src/api/stockApi.ts` | 종목 탐색/시세 | 검색, 상세, 신규상장, 인기검색어, 차트, 수익률 |
| `src/api/sectorApi.ts` | 섹터 | 등락률 랭킹, 수급 랭킹, 상세 |
| `src/api/watchlistApi.ts` | 관심 목록 | 그룹 CRUD, 종목 추가/제거/메모 수정 |

신규 도메인 추가 시 이 표를 업데이트할 것.
