# Query Key 레퍼런스

> 모든 도메인의 Query Key 팩토리를 한 곳에서 확인합니다.
> 실제 정의는 각 `src/api/[domain]Api.ts` 파일 상단에 위치합니다.
> `invalidateQueries` 작성 시 이 파일을 참조하세요.

---

## 규칙

- Query Key는 **반드시 팩토리 함수**를 사용 — 하드코딩 금지
- 상위 키를 무효화하면 하위 키도 함께 무효화됨
- mutation 성공 후 `onSuccess`에서 관련 키를 반드시 무효화할 것

```ts
// ✅ 올바른 사용
queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });

// ❌ 금지
queryClient.invalidateQueries({ queryKey: ['portfolios', 'list'] });
```

---

## portfolioKeys

```ts
// src/api/portfolioApi.ts
export const portfolioKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  detail: (id: number) => [...portfolioKeys.all, 'detail', id] as const,
  health: (id: number) => [...portfolioKeys.all, 'health', id] as const,
  advice: (id: number) => [...portfolioKeys.all, 'advice', id] as const,
  analysis: {
    backtest: (id: number) =>
      [...portfolioKeys.all, 'analysis', 'backtest', id] as const,
    correlation: (id: number) =>
      [...portfolioKeys.all, 'analysis', 'correlation', id] as const,
    diversification: (id: number) =>
      [...portfolioKeys.all, 'analysis', 'diversification', id] as const,
    rebalancing: (id: number) =>
      [...portfolioKeys.all, 'analysis', 'rebalancing', id] as const,
    valuation: (id: number) =>
      [...portfolioKeys.all, 'analysis', 'valuation', id] as const,
  },
};
```

| 키 | 무효화 범위 |
|---|---|
| `portfolioKeys.all` | 포트폴리오 전체 (목록 + 상세 + 분석 모두) |
| `portfolioKeys.lists()` | 목록만 |
| `portfolioKeys.detail(id)` | 특정 포트폴리오 상세 |
| `portfolioKeys.health(id)` | 건강 진단 |
| `portfolioKeys.advice(id)` | AI 리밸런싱 조언 |
| `portfolioKeys.analysis.backtest(id)` | 백테스팅 결과 |
| `portfolioKeys.analysis.correlation(id)` | 상관관계 분석 |
| `portfolioKeys.analysis.diversification(id)` | 자산 분산도 분석 |
| `portfolioKeys.analysis.rebalancing(id)` | 리밸런싱 분석 |
| `portfolioKeys.analysis.valuation(id)` | 자산 가치 분석 |

---

## stockKeys

```ts
// src/api/stockApi.ts
export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  search: (params: object) => [...stockKeys.lists(), params] as const,
  detail: (ticker: string) => [...stockKeys.all, 'detail', ticker] as const,
  priceHistory: (ticker: string, params: object) =>
    [...stockKeys.detail(ticker), 'price-history', params] as const,
  returns: (ticker: string, period: string) =>
    [...stockKeys.detail(ticker), 'returns', period] as const,
  newListings: () => [...stockKeys.all, 'new-listings'] as const,
  popularSearch: () => [...stockKeys.all, 'popular-search'] as const,
  searchHistory: () => [...stockKeys.all, 'search-history'] as const,
};
```

| 키 | 무효화 범위 |
|---|---|
| `stockKeys.all` | 종목 전체 |
| `stockKeys.search(params)` | 특정 검색 결과 |
| `stockKeys.detail(ticker)` | 특정 종목 상세 + 하위 시세/수익률 |
| `stockKeys.priceHistory(ticker, params)` | 차트 시세 데이터 |
| `stockKeys.returns(ticker, period)` | 수익률 데이터 |
| `stockKeys.searchHistory()` | 최근 검색어 목록 |

---

## sectorKeys

```ts
// src/api/sectorApi.ts
export const sectorKeys = {
  all: ['sectors'] as const,
  rankingFluctuation: (params: object) =>
    [...sectorKeys.all, 'ranking', 'fluctuation', params] as const,
  rankingSupply: (params: object) =>
    [...sectorKeys.all, 'ranking', 'supply', params] as const,
  detail: (code: string, date?: string) =>
    [...sectorKeys.all, 'detail', code, date ?? ''] as const,
};
```

| 키 | 무효화 범위 |
|---|---|
| `sectorKeys.all` | 섹터 전체 |
| `sectorKeys.rankingFluctuation(params)` | 등락률 랭킹 |
| `sectorKeys.rankingSupply(params)` | 수급 랭킹 |
| `sectorKeys.detail(code, date)` | 특정 섹터 상세 |

---

## watchlistKeys

```ts
// src/api/watchlistApi.ts
export const watchlistKeys = {
  all: ['watchlist'] as const,
  groups: () => [...watchlistKeys.all, 'groups'] as const,
  items: (groupId: number) =>
    [...watchlistKeys.all, 'items', groupId] as const,
};
```

| 키 | 무효화 범위 |
|---|---|
| `watchlistKeys.all` | 관심 목록 전체 |
| `watchlistKeys.groups()` | 그룹 목록 |
| `watchlistKeys.items(groupId)` | 특정 그룹의 종목 목록 |

---

## authKeys

```ts
// src/api/authApi.ts
// 인증 API는 mutation 전용 — useQuery 없음
// Login / Logout / Reissue 모두 useMutation으로만 사용
```

---

## 도메인 간 무효화 예시

```ts
// 포트폴리오 삭제 후 목록 갱신
queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });

// 포트폴리오 수정 후 상세 + 분석 전체 갱신
queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(id) });

// 관심 종목 추가 후 해당 그룹 종목 목록 갱신
queryClient.invalidateQueries({ queryKey: watchlistKeys.items(groupId) });

// 검색어 삭제 후 최근 검색어 갱신
queryClient.invalidateQueries({ queryKey: stockKeys.searchHistory() });

// 로그아웃 시 전체 캐시 초기화
queryClient.clear();
```
