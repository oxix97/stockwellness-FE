# TanStack Query v5 가이드

---

## QueryClient 설정

```ts
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 기본 5분 — 도메인별로 override 가능
    },
  },
});
```

---

## Query Key 팩토리 패턴

각 API 모듈 파일(`src/api/[domain]Api.ts`) 상단에 정의합니다.

```ts
// 계층적 구조 — 상위 키 무효화 시 하위 키도 함께 무효화됨
export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (keyword: string) => [...stockKeys.lists(), keyword] as const,
  detail: (ticker: string) => [...stockKeys.all, 'detail', ticker] as const,
  priceHistory: (ticker: string, period: string) =>
    [...stockKeys.detail(ticker), 'price', period] as const,
  returns: (ticker: string, period: string) =>
    [...stockKeys.detail(ticker), 'returns', period] as const,
};

export const sectorKeys = {
  all: ['sectors'] as const,
  ranking: {
    fluctuation: (params: object) => [...sectorKeys.all, 'ranking', 'fluctuation', params] as const,
    supply: (params: object) => [...sectorKeys.all, 'ranking', 'supply', params] as const,
  },
  detail: (code: string) => [...sectorKeys.all, 'detail', code] as const,
};
```

### 무효화 전략

```ts
// 특정 종목 캐시만 무효화
queryClient.invalidateQueries({ queryKey: stockKeys.detail('005930') });

// 모든 종목 목록 캐시 무효화
queryClient.invalidateQueries({ queryKey: stockKeys.lists() });

// 종목 도메인 전체 무효화
queryClient.invalidateQueries({ queryKey: stockKeys.all });
```

---

## useQuery 패턴

### 기본 조회

```ts
export const useStock = (ticker: string) =>
  useQuery({
    queryKey: stockKeys.detail(ticker),
    queryFn: () => getStockDetail(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 30, // 시세 데이터는 30초 (짧게)
  });
```

### 인증 조건부 실행

```ts
// 로그인된 경우에만 실행
export const useWatchlistGroups = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: watchlistKeys.groups(),
    queryFn: getWatchlistGroups,
    enabled: !!accessToken,
  });
};
```

### 페이지네이션 (이전 데이터 유지)

```ts
export const useStockSearch = (keyword: string, page: number) =>
  useQuery({
    queryKey: stockKeys.list(keyword),
    queryFn: () => searchStocks({ keyword, page, size: 20 }),
    enabled: keyword.length >= 1,
    placeholderData: keepPreviousData, // 페이지 전환 시 이전 결과 유지
  });
```

---

## useMutation 패턴

### 기본 뮤테이션

```ts
export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });
    },
    onError: (error) => {
      const msg = error instanceof ApiError ? error.message : '오류가 발생했습니다.';
      toast.error(msg);
    },
  });
};
```

### Optimistic Update (관심 종목 토글 등)

```ts
export const useRemoveWatchlistItem = (groupId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticker }: { ticker: string }) =>
      removeWatchlistItem(groupId, ticker),
    onMutate: async ({ ticker }) => {
      await queryClient.cancelQueries({ queryKey: watchlistKeys.items(groupId) });
      const previous = queryClient.getQueryData(watchlistKeys.items(groupId));

      // 낙관적으로 제거
      queryClient.setQueryData(watchlistKeys.items(groupId), (old: WatchlistItemsData) => ({
        ...old,
        items: old.items.filter((i) => i.ticker !== ticker),
      }));
      return { previous };
    },
    onError: (_, __, ctx) => {
      // 실패 시 롤백
      queryClient.setQueryData(watchlistKeys.items(groupId), ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.items(groupId) });
    },
  });
};
```

---

## 로딩 / 에러 처리

```tsx
const { data, isLoading, isError, error } = usePortfolio(id);

if (isLoading) return <Skeleton />;
if (isError) {
  const msg = error instanceof ApiError ? error.message : '오류가 발생했습니다.';
  return <ErrorMessage message={msg} />;
}
```

---

## 캐시 수동 조작

```ts
// 캐시 직접 설정 (로그인 직후 유저 정보 미리 채우기 등)
queryClient.setQueryData(portfolioKeys.detail(id), newData);

// 로그아웃 시 전체 캐시 초기화
queryClient.clear();

// 특정 쿼리 강제 재실행
queryClient.refetchQueries({ queryKey: portfolioKeys.lists() });
```

---

## 자주 하는 실수

| ❌ 잘못된 패턴 | ✅ 올바른 패턴 |
|---|---|
| `queryKey: ['portfolios', id]` (하드코딩) | `queryKey: portfolioKeys.detail(id)` |
| nullable id에 `enabled` 누락 | `enabled: !!id` 추가 |
| mutation 성공 후 invalidate 누락 | `onSuccess`에서 반드시 invalidate |
| 서버 데이터를 Zustand에 복사 저장 | Query 캐시에서 직접 읽기 |
| 인증 필요한 쿼리에 `enabled` 누락 | `enabled: !!accessToken` 추가 |
