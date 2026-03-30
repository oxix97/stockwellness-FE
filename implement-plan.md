# 프론트엔드 구현 계획

> 작성일: 2026-03-27
> 출처: `fix-backtest.md`, `fix-search-stockdetail.md`, `IMPL-PLAN.md`

---

## 진행 상태 요약

| # | 심각도 | 작업 | 파일 | 상태 |
|---|--------|------|------|------|
| 1 | 🔴 | 검색 무한 스크롤 — `!lastPage.last` 임시 대응 | `src/hooks/use-stock.ts` | ✅ 완료 |
| 2 | 🔴 | 401 인터셉터 `_retry` 플래그 확인·추가 | `src/api/client.ts` | ✅ 기존 구현 확인 |
| 3 | 🟡 | `use-backtest.ts` — `serverMetrics` 노출 및 화면 적용 | `src/hooks/use-backtest.ts`, `BacktestResult.tsx` | ✅ 완료 |
| 4 | 🟡 | `BacktestResult.tsx` — 벤치마크 비교선 조건부 렌더링 | `src/app/components/screens/BacktestResult.tsx` | ✅ 완료 |
| 5 | 🟡 | 종목 상세 차트 — `benchmarks.length === 0` 비교선 미렌더링 | `src/app/components/screens/StockDetail.tsx` | ✅ 완료 |
| 6 | 🟡 | 종목 상세 수익률 카드 — `benchmarkReturnRate === 0` 처리 | `src/app/components/screens/StockDetail.tsx` | ✅ 완료 |
| 7 | 🟡 | `ChartPeriod` / `ChartFrequency` union 타입 추가 | `src/types/api.ts`, `src/api/stock.ts`, `use-stock.ts` | ✅ 완료 |
| 8 | 🟡 | `schema.d.ts` 갱신 | `src/types/schema.d.ts` | ⬜ BE openapi3 배포 후 |
| 9 | 🟢 | `BacktestRequest.period` 클라이언트 전용 주석 | `src/types/api.ts` | ✅ 완료 |
| 10 | 🔴 | `SimulationTab.tsx` — 필드 누락·아키텍처 위반·기간 미반영 버그 | `src/app/components/portfolio/tabs/SimulationTab.tsx` | ⬜ 대기 ([#133](https://github.com/oxix97/stockwellness-FE/issues/133)) |

---

## 🔴 작업 1: 검색 무한 스크롤 — `!lastPage.last` 임시 대응

**파일:** `src/hooks/use-stock.ts:27`

**원인:** `getNextPageParam`이 `lastPage.hasNext`를 참조하는데 실제 API 응답에 해당 필드가 없어 항상 `undefined` 반환 → 첫 페이지 이후 로드 없음.

```typescript
// 수정 전
getNextPageParam: (lastPage: StockSearchResponse) =>
  (lastPage.hasNext ? lastPage.number + 1 : undefined),

// 수정 후 (BE SliceResponse 배포 전 임시)
getNextPageParam: (lastPage: StockSearchResponse) =>
  (!lastPage.last ? lastPage.number + 1 : undefined),
```

> BE에서 `SliceResponse<T>` DTO 배포 후 `lastPage.hasNext`로 원복. (`hasNext === !last`)

**완료 조건**
- [ ] 검색어 입력 후 스크롤 시 두 번째 페이지 로드 확인
- [ ] 마지막 페이지 도달 시 추가 요청 없음 확인

---

## 🔴 작업 2: 401 인터셉터 `_retry` 플래그 확인·추가

**파일:** `src/api/client.ts`

**원인:** 타인 포트폴리오 접근 시 BE가 `A001`(401)을 반환. 인터셉터가 401 수신 시 재발급 후 재시도하므로 `401 → 재발급 → 재시도 → 401 → ...` 루프 후 강제 로그아웃 발생 가능.

`_retry` 플래그 존재 여부를 확인하고, 없으면 아래 패턴으로 추가:

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await reissueToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        useAuthStore.getState().clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

> BE에서 `PortfolioAccessDeniedException`을 403(A002)으로 수정하면 자동 해소. 배포 전까지 방어 코드 유지.

**완료 조건**
- [ ] 타인 포트폴리오 접근 시 루프 없이 단일 에러 처리 확인
- [ ] 정상 401 (만료 토큰) 시 재발급 + 재시도 정상 동작 확인

---

## 🟡 작업 3: `use-backtest.ts` — `serverMetrics` 노출

**파일:** `src/hooks/use-backtest.ts`

**원인:** BE `BacktestResponse`에 서버 계산 지표(`cagr`, `mdd`, `sharpeRatio`, `beta` 등)가 포함되어 있으나, `computeMetrics()`가 `dailyResults`로 재계산해 전체 기간 표시 시 BE·FE 수치가 다를 수 있음.

```typescript
export function useBacktest(period?: string) {
  const portfolioId = useAuthStore((state) => state.portfolioId) || "1";

  const mutation = useMutation({
    mutationFn: (params: BacktestRequest) =>
      portfolioApi.runBacktest(portfolioId, params),
  });

  const data = mutation.data;
  const processedResults =
    data && period ? sliceByPeriod(data.dailyResults, period) : data?.dailyResults;

  return {
    run: mutation.mutate,
    runAsync: mutation.mutateAsync,
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    /** 기간 슬라이싱된 결과 기반 클라이언트 계산 지표 */
    metrics: processedResults ? computeMetrics(processedResults) : null,
    /** BE 서버 계산 지표 — 전체 기간 기준 (슬라이싱 미적용) */
    serverMetrics: data
      ? {
          cagr: data.cagr,
          mdd: data.mdd,
          sharpeRatio: data.sharpeRatio,
          beta: data.beta,
          bestYearRate: data.bestYearRate,
          worstYearRate: data.worstYearRate,
          alpha: data.alpha,
          totalReturnRate: data.totalReturnRate,
        }
      : null,
    aiComment: data?.aiComment ?? null,
  };
}
```

**완료 조건**
- [ ] `serverMetrics` 필드가 `null`이 아닐 때 값이 정상 채워짐 확인
- [ ] `BacktestResult.tsx`에서 `serverMetrics`를 import해 활용 가능한 상태

---

## 🟡 작업 4: `BacktestResult.tsx` — 벤치마크 비교선 조건부 렌더링

**파일:** `src/app/components/screens/BacktestResult.tsx` → `ChartSection` 컴포넌트

**원인:** `benchmarkReturnRate`가 모든 데이터 포인트에서 `0`일 때 차트 하단에 수평 점선이 항상 표시되어 오해를 줌.

```tsx
function ChartSection({ backtestData }: { backtestData: any[] }) {
  const data = backtestData ?? [];

  const hasBenchmarkData = data.some(
    (r: any) => (r.benchmarkReturnRate ?? 0) !== 0
  );

  return (
    // ...
    <ComposedChart data={data}>
      {/* 벤치마크 데이터가 있을 때만 렌더링 */}
      {hasBenchmarkData && (
        <Line
          type="monotone"
          dataKey="benchmarkReturnRate"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="벤치마크"
        />
      )}
      <Line
        type="monotone"
        dataKey="totalValue"
        stroke="#2EBE7A"
        strokeWidth={4}
        dot={false}
        name="내 포트폴리오"
      />
    </ComposedChart>
  );
}
```

**완료 조건**
- [ ] `benchmarkReturnRate`가 전부 0인 경우 벤치마크 선 미표시 확인
- [ ] 유효한 값이 있으면 정상 표시 확인

---

## 🟡 작업 5: 종목 상세 차트 — `benchmarks.length === 0` 비교선 미렌더링

**파일:** 종목 상세 차트 컴포넌트 (파일명 확인 후 수정)

**원인:** `GET /api/v1/stocks/{ticker}/prices/history` 응답에서 벤치마크 배치 미실행으로 `benchmarks: []` 반환. 빈 배열을 그대로 렌더링하면 빈 선이 그려짐.

```typescript
const hasBenchmarkData = benchmarks && benchmarks.length > 0;

{hasBenchmarkData && (
  <Line
    dataKey="benchmarkReturn"
    name="KOSPI"
    stroke="#9CA3AF"
    strokeDasharray="5 5"
    dot={false}
  />
)}
```

**완료 조건**
- [ ] `benchmarks: []` 응답 시 KOSPI 비교선 미표시 확인
- [ ] 벤치마크 데이터 있을 때 정상 표시 확인

---

## 🟡 작업 6: 종목 상세 수익률 카드 — `benchmarkReturnRate === 0` 처리

**파일:** 수익률 카드 컴포넌트 (파일명 확인 후 수정)

**원인:** `GET /api/v1/stocks/{ticker}/returns` 응답에서 `benchmarkReturnRate: 0` 반환. 실제 0% 수익률과 데이터 없음(0)이 동일하게 표시되어 혼동 발생.

```typescript
{benchmarkReturnRate !== 0 ? (
  <span>KOSPI 대비 {benchmarkReturnRate}%</span>
) : (
  <span className="text-muted-foreground text-sm">벤치마크 데이터 없음</span>
)}
```

**완료 조건**
- [ ] `benchmarkReturnRate: 0` 응답 시 "벤치마크 데이터 없음" 표시 확인
- [ ] 벤치마크 데이터 적재 후 실제 수익률 표시 확인

---

## 🟡 작업 7: `ChartPeriod` / `ChartFrequency` union 타입 추가

**파일:** `src/types/api.ts` (또는 `src/types/stock.ts`)

**원인:** BE가 잘못된 `period` 값을 `1Y`로 silently fallback. 컴파일 타임에 잘못된 값을 차단해 버그 탐지를 앞당김.

```typescript
/** 주가 차트 조회 기간 */
export type ChartPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

/** 주가 차트 집계 단위 */
export type ChartFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
```

**파일:** `src/api/stockApi.ts`

```typescript
getPriceHistory: async (
  ticker: string,
  period: ChartPeriod = "1Y",
  frequency: ChartFrequency = "DAILY"
): Promise<StockPriceHistoryResponse> => { ... }
```

> BE에서 잘못된 `period` 전달 시 400 반환으로 수정되면, FE 타입 안전성과 함께 에러 토스트로 사용자에게 알릴 수 있음.

**완료 조건**
- [ ] 잘못된 period 값 전달 시 TypeScript 컴파일 에러 발생 확인
- [ ] 기존 `"1Y"`, `"DAILY"` 등 유효값 동작 이상 없음 확인

---

## 🟡 작업 8: `schema.d.ts` 갱신 (BE openapi3 배포 후)

**파일:** `src/types/schema.d.ts`

**조건:** BE REST Docs 테스트 수정 후 openapi3 재생성 시 실행.

```bash
# 1. BE openapi3 task 실행 (BE 프로젝트에서)
./gradlew :stockwellness-api:test openapi3

# 2. 생성된 openapi3.yaml을 FE 루트로 복사
cp stockwellness-api/build/api-spec/openapi3.yaml stockwellness-front/openapi3.yaml

# 3. FE schema.d.ts 재생성
cd stockwellness-front
npx openapi-typescript openapi3.yaml -o src/types/schema.d.ts
```

**완료 조건**
- [ ] 재생성된 `schema.d.ts`에 `benchmarkReturnRate`, `benchmarkReturnRates`, `comparisons` 포함 확인
- [ ] 수동 편집 흔적(`// ← 추가` 주석 등) 없음 확인
- [ ] `npm run build` TypeScript 컴파일 통과

---

## 🟢 작업 9: `BacktestRequest.period` 클라이언트 전용 주석

**파일:** `src/types/api.ts`

**원인:** `BacktestRequest.period`는 BE DTO에 없어 서버에서 무시됨. 주석 없으면 추후 개발자 오해 가능.

```typescript
export interface BacktestRequest {
  strategy: "DCA" | "LUMP_SUM";
  amount: number;
  benchmarkTicker: string;
  /**
   * 클라이언트 사이드 필터링 전용.
   * BE는 이 값을 무시하고 전체 이력 데이터를 반환한다.
   * 실제 기간 슬라이싱은 use-backtest.ts sliceByPeriod()에서 처리.
   */
  period: string;
  rebalancingPeriod: string;
  weights?: Record<string, number>;
}
```

**완료 조건**
- [ ] 주석 추가 후 타입 이상 없음 확인

---

## 작업 의존성

```
BE SliceResponse 배포
    └── 작업 1 원복: !lastPage.last → lastPage.hasNext

BE PortfolioAccessDeniedException 403 배포
    └── 작업 2 (_retry 플래그) 자동 해소 — 배포 전 방어 코드 유지

BE openapi3 재생성
    └── 작업 8 (schema.d.ts 갱신)

작업 3, 4, 5, 6, 7, 9 → 독립적으로 즉시 진행 가능
작업 10 → 독립적으로 즉시 진행 가능 (Issue #133)
```

---

## 🔴 작업 10: `SimulationTab.tsx` — 복합 버그 수정 (Issue #133)

**배경**
코드 리뷰에서 발견된 기존 버그. 4가지 문제가 복합적으로 존재.

**수정 파일:** `src/app/components/portfolio/tabs/SimulationTab.tsx`

### 버그 목록

| # | 종류 | 내용 |
|---|------|------|
| ① | TS 에러 | `BacktestRequest`에 `period`, `rebalancingPeriod` 미전달 |
| ② | 아키텍처 위반 | 컴포넌트에서 `portfolioApi` 직접 import (CLAUDE.md 금지) |
| ③ | 기능 버그 | `period` 상태가 query key에만 있고 API 파라미터에 미전달 → 기간 탭 변경 무효 |
| ④ | null-safe | `d.benchmarkReturnRate.toFixed(2)` — nullish 시 런타임 에러 |

### 수정 방향

`use-backtest.ts`에 이미 `usePortfolioSimulation(period)` 훅이 존재하여 동일한 동작을 올바르게 구현함.
직접 `useQuery` + `portfolioApi` 호출을 이 훅으로 교체하면 ①②③ 모두 해소됨.

```typescript
// 수정 전
import { portfolioApi } from "@/api/portfolio";          // ② 위반
import { useQuery } from "@tanstack/react-query";

const backtest = useQuery({
  queryKey: ["portfolio", portfolioId, "backtest", period],
  queryFn: () =>
    portfolioApi.runBacktest(portfolioId!, {             // ① 필드 누락
      strategy: "LUMP_SUM",
      amount: 10_000_000,
      benchmarkTicker: "SPY",
      // period, rebalancingPeriod 없음
    }),                                                  // ③ 기간 미반영
  enabled: !!portfolioId,
  staleTime: 1000 * 60 * 5,
});

// 수정 후
import { usePortfolioSimulation } from "@/hooks/use-backtest";

const backtest = usePortfolioSimulation(period);         // ①②③ 모두 해소
```

null-safe 처리 (④):

```typescript
const chartData =
  backtest.data?.dailyResults?.map((d) => ({
    date: d.date.slice(5),
    portfolio: Number((d.returnRate ?? 0).toFixed(2)),
    benchmark: d.benchmarkReturnRate ? Number(d.benchmarkReturnRate.toFixed(2)) : null,
  })) ?? [];

const hasBenchmarkData = chartData.some((d) => d.benchmark !== null);
```

벤치마크 선 조건부 렌더링:

```tsx
{hasBenchmarkData && (
  <Line
    type="monotone"
    dataKey="benchmark"
    stroke="#94A3B8"
    strokeWidth={1.5}
    strokeDasharray="4 4"
    dot={false}
  />
)}
```

**완료 조건**
- [ ] TypeScript 컴파일 에러 없음
- [ ] `portfolioApi` 직접 import 제거
- [ ] 기간 탭 변경 시 차트 슬라이싱 반영 확인
- [ ] `benchmarkReturnRate` null 시 런타임 오류 없음
- [ ] 벤치마크 데이터 없을 때 비교선 미렌더링

---

## 배포 후 재검증 체크리스트

- [ ] 검색 무한 스크롤 동작 (BE SliceResponse 배포 후 `lastPage.hasNext` 원복)
- [ ] 타인 포트폴리오 접근 시 403 처리 → 로그인 리다이렉트 미발생
- [ ] 백테스트 결과 — 벤치마크 대비 수익률 정상 표시 (0이 아닌 실제 값)
- [ ] `beta` 지표가 합리적인 값 (0.5 ~ 1.5 범위) 으로 계산
- [ ] 벤치마크 배치 적재 후 — 종목 상세 차트 비교선 + 수익률 카드 정상 표시
- [ ] 잘못된 period 전달 시 에러 토스트 표시 (400 수신 후 처리)
