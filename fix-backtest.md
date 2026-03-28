# Fix: 백테스트 화면 API 연동 검증 결과 (2026-03-27)

> 검증 대상: `/backtest/setup` 화면, `/backtest/result` 화면
> 백엔드 수정 사항은 `stockwellness/fix-backtest.md` 참고

---

## 🔴 BLOCKER: `benchmarkReturnRate` 필드 누락 → outperformance / beta 항상 0

### 현상

`use-backtest.ts`의 `computeMetrics()`가 `r.benchmarkReturnRate`를 참조하지만,
BE가 `benchmarkReturnRates: Map` 만 직렬화하므로 런타임에 항상 `undefined`가 된다.

```typescript
// use-backtest.ts:50 — benchmarkReturnRate가 undefined이므로 benchmarkReturn = 0
const benchmarkReturn = last.benchmarkReturnRate ?? 0;

// use-backtest.ts:82 — beta 공분산 계산에 사용; 항상 0
const prevRate = results[i].benchmarkReturnRate ?? 0;
```

**증상:**
- `BacktestResult` 화면 — "벤치마크 대비 +0.0%" 고정 표시
- `beta` 계산 — 분산이 0이므로 항상 기본값 `1`

### 조치 완료 ✅

**백엔드 수정**: `BacktestResponse.DailyResult`에 `benchmarkReturnRate` 스칼라 필드 추가 (BE fix-backtest.md 참고).

**FE 타입 수정 파일:** `src/types/schema.d.ts`

```typescript
// 수정 전 (benchmarkReturnRates 없음)
dailyResults?: {
  benchmarkReturnRate: number;  // 있었지만 BE가 해당 필드명을 응답하지 않는 상태
  ...
}[]

// 수정 후
dailyResults?: {
  benchmarkReturnRate: number;           // ← 주요 벤치마크 수익률 스칼라
  benchmarkReturnRates: Record<string, number>; // ← 다중 지수 맵 추가
  ...
}[]
comparisons?: {                          // ← comparisons 배열 추가
  indexName: string;
  ticker: string;
  totalReturn: number;
  alpha: number;
  beta: number;
}[]
```

> BE 배포 후 `benchmarkReturnRate` 필드가 응답에 포함되면 FE 수정 없이 자동 해소.

---

## 🟡 MAJOR 1: `computeMetrics` — BE 제공 지표 미사용 (이중 계산)

### 현상

BE `BacktestResponse`에는 이미 서버에서 계산된 성과 지표가 포함되어 있다.

```typescript
data.cagr, data.mdd, data.sharpeRatio, data.beta,
data.bestYearRate, data.worstYearRate, data.alpha
```

`use-backtest.ts`의 `computeMetrics()`는 이를 무시하고 `dailyResults`로 직접 재계산한다.

### 문제점

기간 슬라이싱 시 FE 재계산은 필요하다. 그러나 전체 기간(period = "ALL" 또는 기간 미적용)을 표시할 때는
BE와 FE 계산 결과가 달라질 수 있다.

예시 차이:
- BE CAGR: 거래일 기반 실제 계산
- FE CAGR: `results.length / 252` 근사치

### 수정 방법

**수정 위치:** `src/hooks/use-backtest.ts` — `useBacktest()` 반환값

BE 최상위 지표를 함께 반환해 `BacktestResult.tsx`에서 선택적으로 사용할 수 있도록 노출한다.

```typescript
export function useBacktest(period?: string) {
  // ...기존 코드 유지...

  return {
    run: mutation.mutate,
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    metrics: processedResults ? computeMetrics(processedResults) : null,
    /** BE 서버 계산 지표 — 전체 기간 기준 */
    serverMetrics: data
      ? {
          cagr: data.cagr,
          mdd: data.mdd,
          sharpeRatio: data.sharpeRatio,
          beta: data.beta,
          bestYearRate: data.bestYearRate,
          worstYearRate: data.worstYearRate,
          alpha: data.alpha,
        }
      : null,
    aiComment: data?.aiComment ?? null,
  };
}
```

`BacktestResult.tsx`에서는 period 슬라이싱이 없거나 전체 기간인 경우 `serverMetrics`를 우선 사용한다.

> 단기 조치로는 서버 지표를 노출만 해도 충분하다. 화면 적용 여부는 별도 이슈로 관리.

---

## 🟡 MAJOR 2: 벤치마크 데이터 없을 때 차트 처리 미흡

### 현상

`BacktestResult.tsx > ChartSection`의 벤치마크 비교선은 `benchmarkReturnRate`를 dataKey로 사용한다.

```tsx
<Line type="monotone" dataKey="benchmarkReturnRate" stroke="#9CA3AF" ... name="벤치마크" />
```

`benchmarkReturnRate`가 모든 포인트에서 `0`이면 (벤치마크 데이터 없거나 매핑 실패 시)
차트 하단에 수평선이 항상 표시되어 사용자에게 오해를 준다.

### 수정 방법

**수정 위치:** `src/app/components/screens/BacktestResult.tsx > ChartSection`

```tsx
// benchmarkReturnRate가 모두 0인지 확인
const hasBenchmarkData = data.some((r: any) => (r.benchmarkReturnRate ?? 0) !== 0);

// 조건부 렌더링
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
```

---

## ⚠️ 설계 결정 사항: `period` 파라미터

`BacktestSetup`이 `period`를 request body에 포함해서 BE로 보내지만, BE는 이를 무시한다.

- BE `BacktestRequest` DTO에 `period` 필드 없음 → Jackson이 unknown field로 처리 (기능 오류 없음)
- FE `BacktestRequest` 타입에는 `period: string` 포함

현재 설계: BE는 전체 이력 데이터를 반환하고 FE에서 `sliceByPeriod()`로 클라이언트 슬라이싱.

**조치 불필요** — 기능 동작에 문제 없음. 단, FE `BacktestRequest` 타입의 `period` 필드에
아래 주석을 추가해 의도를 명확히 한다.

```typescript
export interface BacktestRequest {
  // ...
  /**
   * 클라이언트 사이드 슬라이싱 전용. BE는 이 값을 무시하고 전체 이력 데이터를 반환한다.
   * 기간 필터링은 use-backtest.ts sliceByPeriod()에서 처리.
   */
  period: string;
  // ...
}
```

---

## 수정 우선순위 요약

| 우선순위 | 파일 | 수정 내용 |
|---------|------|----------|
| 🔴 완료 | `src/types/schema.d.ts` | `benchmarkReturnRates`, `comparisons` 필드 추가 |
| 🟡 **대기** | `src/hooks/use-backtest.ts` | `serverMetrics` 노출 추가 |
| 🟡 **대기** | `BacktestResult.tsx > ChartSection` | `benchmarkReturnRate` 데이터 없을 때 비교선 미렌더링 |
| 🟢 **대기** | `src/types/api.ts > BacktestRequest` | `period` 필드에 클라이언트 전용 주석 추가 |

---

## BE 배포 후 재검증 항목

- [ ] `BacktestResult` 화면 — "벤치마크 대비 +X%" 수치가 0이 아닌 실제 값으로 표시
- [ ] `beta` 지표가 합리적인 값(0.5 ~ 1.5 범위)으로 계산
- [ ] 벤치마크 데이터 없는 종목으로 백테스트 시 차트에 수평선 미표시 확인
