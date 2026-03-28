# 프론트엔드 구현 계획

> 작성일: 2026-03-27
> 출처: `fix-search-stockdetail.md`, `fix-backtest.md`
> 대응 BE 계획: `stockwellness/IMPL-PLAN.md`

---

## 진행 상태 요약

| # | 심각도 | 작업 | 상태 |
|---|--------|------|------|
| 1 | 🔴 | `use-stock.ts` 무한 스크롤 — `!lastPage.last` 임시 대응 | ⬜ 대기 |
| 2 | 🔴 | `client.ts` 401 인터셉터 `_retry` 플래그 확인 | ⬜ 대기 |
| 3 | 🟡 | `use-backtest.ts` — `serverMetrics` 노출 | ⬜ 대기 |
| 4 | 🟡 | `BacktestResult.tsx` — 벤치마크 비교선 조건부 렌더링 | ⬜ 대기 |
| 5 | 🟡 | 종목 상세 차트 — `benchmarks.length === 0` 비교선 미렌더링 | ⬜ 대기 |
| 6 | 🟡 | 종목 상세 수익률 카드 — `benchmarkReturnRate === 0` 데이터 없음 표시 | ⬜ 대기 |
| 7 | 🟡 | `ChartPeriod` / `ChartFrequency` union 타입 추가 | ⬜ 대기 |
| 8 | 🟡 | `schema.d.ts` 갱신 (BE openapi3 배포 후) | ⬜ BE 작업 4 완료 후 |
| 9 | 🟢 | `BacktestRequest.period` 클라이언트 전용 주석 | ⬜ 대기 |

---

## 🔴 작업 1: `use-stock.ts` 무한 스크롤 — `!lastPage.last` 임시 대응

**배경**
BE `Slice` 직렬화에 `hasNext` 필드가 없어 검색 결과 무한 스크롤이 첫 페이지 이후 멈춘다.
BE에서 `SliceResponse<T>` DTO를 배포하기 전까지 `last` 필드로 임시 대응한다.

**수정 파일:** `src/hooks/use-stock.ts:27`

```typescript
// 수정 전
getNextPageParam: (lastPage: StockSearchResponse) =>
  (lastPage.hasNext ? lastPage.number + 1 : undefined),

// 수정 후 (BE SliceResponse 배포 전 임시)
getNextPageParam: (lastPage: StockSearchResponse) =>
  (!lastPage.last ? lastPage.number + 1 : undefined),
```

> **BE 배포 후 원복**: `SliceResponse`에 `hasNext`가 추가되면 원래 코드로 복원.
> (`hasNext === !last`이므로 동작은 동일하나, `hasNext`가 명시적으로 읽기 쉬움)

**완료 조건**
- [ ] 검색어 입력 후 스크롤 시 두 번째 페이지 로드 확인
- [ ] 마지막 페이지 도달 시 추가 요청 없음 확인

---

## 🔴 작업 2: `client.ts` 401 인터셉터 `_retry` 플래그 확인

**배경**
BE에서 타인 포트폴리오 접근 시 `A001`(401)을 반환한다. FE 인터셉터가 401을 받으면
토큰 재발급 후 원 요청을 재시도해 무한루프 → 강제 로그아웃이 발생할 수 있다.

**수정 파일:** `src/api/client.ts`

`_retry` 플래그가 이미 구현되어 있는지 확인한다. 없으면 추가:

```typescript
// 응답 인터셉터 — 재시도 1회 제한
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;      // ← 재시도 플래그

      try {
        const newToken = await reissueToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        // 재발급 실패 → 로그인 리다이렉트
        useAuthStore.getState().clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

> **BE 배포 후 자동 해소**: `PortfolioAccessDeniedException`이 403(A002)으로 변경되면
> 인터셉터가 403을 재시도하지 않으므로 이 이슈는 자연히 해소된다.

**완료 조건**
- [ ] 타인 포트폴리오 접근 시 루프 없이 단일 에러 처리 확인
- [ ] 정상 401 (만료 토큰) 시 재발급 + 재시도 정상 동작 확인

---

## 🟡 작업 3: `use-backtest.ts` — `serverMetrics` 노출

**배경**
BE `BacktestResponse`가 `cagr`, `mdd`, `sharpeRatio`, `beta` 등 서버 계산 지표를 포함한다.
현재 `computeMetrics()`가 `dailyResults`로 재계산하는데, 기간 슬라이싱 없이 전체 기간을 표시할 때
BE와 FE 계산값이 다를 수 있다. `serverMetrics`를 병렬로 노출해 화면에서 선택적으로 사용할 수 있게 한다.

**수정 파일:** `src/hooks/use-backtest.ts`

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

**배경**
`benchmarkReturnRate`가 모든 데이터 포인트에서 `0`이면 (벤치마크 미매핑 또는 데이터 없음)
차트 하단에 수평 점선이 항상 표시되어 오해를 준다.

**수정 파일:** `src/app/components/screens/BacktestResult.tsx` — `ChartSection` 컴포넌트

```tsx
function ChartSection({ backtestData }: { backtestData: any[] }) {
  const data = backtestData ?? [];

  // 벤치마크 데이터 유효성 확인
  const hasBenchmarkData = data.some(
    (r: any) => (r.benchmarkReturnRate ?? 0) !== 0
  );

  // ... 기존 mddPeriod 계산 코드 유지 ...

  return (
    <div className="px-6 py-10 bg-card border-b border-border">
      {/* ... */}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          {/* ... 기존 XAxis, YAxis, Tooltip, ReferenceArea ... */}

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
      </ResponsiveContainer>
    </div>
  );
}
```

**완료 조건**
- [ ] `benchmarkReturnRate`가 전부 0인 경우 벤치마크 선 미표시 확인
- [ ] `benchmarkReturnRate`에 유효한 값이 있으면 정상 표시 확인

---

## 🟡 작업 5: 종목 상세 차트 — `benchmarks.length === 0` 비교선 미렌더링

**배경**
`GET /api/v1/stocks/{ticker}/prices/history?includeBenchmark=true` 응답에서
벤치마크 배치 미실행으로 `benchmarks: []`가 반환된다.
빈 배열을 그대로 렌더링하면 빈 선이 그려지거나 에러가 발생할 수 있다.

**수정 파일:** 종목 상세 차트 컴포넌트 (파일명 확인 후 수정)

```typescript
// 차트 컴포넌트 내부
const hasBenchmarkData = benchmarks && benchmarks.length > 0;

// JSX
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

**배경**
`GET /api/v1/stocks/{ticker}/returns` 응답에서 `benchmarkReturnRate: 0`이 반환된다.
실제 0% 수익률과 데이터 없음(0)이 동일하게 표시되어 혼동이 생긴다.

**수정 파일:** 종목 상세 수익률 카드 컴포넌트 (파일명 확인 후 수정)

```typescript
// 수정 전
<span>KOSPI 대비 {benchmarkReturnRate}%</span>

// 수정 후
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

**배경**
BE가 잘못된 `period` 값을 `1Y`로 silently fallback한다.
FE에서 컴파일 타임에 잘못된 값을 차단해 버그 탐지를 앞당긴다.

**수정 파일:** `src/types/api.ts` 또는 `src/types/stock.ts`

```typescript
/** 주가 차트 조회 기간 */
export type ChartPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

/** 주가 차트 집계 단위 */
export type ChartFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
```

**수정 파일:** `src/api/stockApi.ts` (또는 portfolio 관련 API 파일)

```typescript
getPriceHistory: async (
  ticker: string,
  period: ChartPeriod = "1Y",
  frequency: ChartFrequency = "DAILY"
): Promise<StockPriceHistoryResponse> => { ... }
```

> BE에서 잘못된 `period` 전달 시 400을 반환하도록 수정되면,
> FE 타입 안전성과 함께 에러 토스트로 사용자에게 알릴 수 있다.

**완료 조건**
- [ ] 잘못된 period 값 전달 시 TypeScript 컴파일 에러 발생 확인
- [ ] 기존 `"1Y"`, `"DAILY"` 등 유효값 동작 이상 없음 확인

---

## 🟡 작업 8: `schema.d.ts` 갱신 (BE openapi3 배포 후)

**배경**
현재 `src/types/schema.d.ts`는 `benchmarkReturnRates`, `comparisons` 필드가 수동으로 추가된 상태다.
BE REST Docs 테스트 수정(`stockwellness/IMPL-PLAN.md 작업 3`) 후 openapi3를 재생성하면
이 파일을 자동 생성본으로 교체해야 한다.

**실행 순서**

```bash
# 1. BE openapi3 task 실행 (BE 프로젝트에서)
./gradlew :stockwellness-api:test openapi3

# 2. 생성된 openapi3.yaml을 FE 루트로 복사 (경로는 팀 컨벤션에 따름)
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

**배경**
`BacktestRequest.period`는 BE DTO에 없어 서버에서 무시된다.
명시적 주석이 없으면 추후 개발자가 BE가 period를 처리한다고 오해할 수 있다.

**수정 파일:** `src/types/api.ts`

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
BE 작업 2 (SliceResponse 배포)
    └── 작업 1 원복: !lastPage.last → lastPage.hasNext

BE 작업 1 (PortfolioAccessDeniedException 403 배포)
    └── 작업 2 (_retry 플래그)는 BE 배포 후 자동 해소 — 단, 배포 전 방어 코드 유지

BE 작업 4 (schema.d.ts 재생성)
    └── 작업 8 (FE schema.d.ts 갱신)

작업 3, 4, 5, 6, 7, 9는 독립적으로 진행 가능.
```

---

## 배포 후 재검증 체크리스트

- [ ] 검색 무한 스크롤 동작 (BE SliceResponse 배포 후 `lastPage.hasNext` 원복)
- [ ] 타인 포트폴리오 접근 시 403 처리 → 로그인 리다이렉트 미발생
- [ ] 백테스트 결과 — 벤치마크 대비 수익률 정상 표시 (0이 아닌 실제 값)
- [ ] 벤치마크 배치 적재 후 — 종목 상세 차트 비교선 + 수익률 카드 정상 표시
- [ ] 잘못된 period 전달 시 에러 토스트 표시 (400 수신 후 처리)
