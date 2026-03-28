# Fix: 검색·종목 상세 화면 API 연동 검증 결과 (2026-03-27)

> 검증 대상: `/search` 화면, `/stock/:symbol` 화면
> 백엔드 수정 사항은 `stockwellness/fix-search-stockdetail.md` 참고

---

## 🔴 BLOCKER: 무한 스크롤 미작동 — `hasNext` 필드 없음

### 현상

검색 결과 무한 스크롤이 작동하지 않는다. 첫 페이지 이후 추가 로드 없음.

### 근본 원인

`use-stock.ts`의 `getNextPageParam`이 `lastPage.hasNext`를 참조하는데,
실제 API 응답에 `hasNext` 필드가 없어 항상 `undefined`(falsy)를 반환한다.

**수정 위치:** `src/hooks/use-stock.ts:27`

```typescript
// 현재 — hasNext가 undefined이므로 항상 undefined 반환 → 다음 페이지 없음
getNextPageParam: (lastPage: StockSearchResponse) =>
  (lastPage.hasNext ? lastPage.number + 1 : undefined),
```

### 수정 방법

백엔드가 `hasNext` 필드를 응답에 추가하기 전까지 `last` 필드로 임시 대응한다.

```typescript
// 수정 후 (임시 — BE 배포 전까지)
getNextPageParam: (lastPage: StockSearchResponse) =>
  (!lastPage.last ? lastPage.number + 1 : undefined),
```

백엔드에서 `hasNext` 필드가 추가된 후 원래 코드로 복원해도 무방하다.
(`hasNext === !last`이므로 동작은 동일)

---

## 🔴 BLOCKER 파생: 401 인터셉터 무한루프 위험

### 현상

타인의 포트폴리오에 접근할 경우 백엔드가 `A001`(401)을 반환한다.
Response 인터셉터가 401을 받으면 토큰 재발급 후 원 요청을 재시도하므로:
`401 수신 → 재발급 → 재시도 → 401 수신 → ...` 루프 후 로그인 리다이렉트가 발생할 수 있다.

**백엔드에서 `A002`(403)로 수정 예정.** 배포 전까지 FE에서 방어한다.

**수정 위치:** `src/api/client.ts` — 401 재시도 인터셉터

기존 로직을 유지하되, 같은 요청에 대한 재시도가 한 번 이상 발생하지 않도록 보장한다.
`_retry` 플래그가 이미 구현되어 있다면 확인만 한다.

```typescript
// client.ts 인터셉터에 _retry 플래그가 있는지 확인
// originalRequest._retry === true이면 재시도 없이 reject
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  // 재발급 시도 ...
}
```

> BE 수정(`A001` → `A002`) 배포 후 이 이슈는 자동 해소된다.

---

## 🟡 MAJOR 1: 벤치마크 데이터 없을 때 UI 처리

### 현상

- `GET /api/v1/stocks/{ticker}/prices/history` → `benchmarks: []`
- `GET /api/v1/stocks/{ticker}/returns` → `benchmarkReturnRate: 0`

벤치마크 배치 데이터가 없는 상태이며, 백엔드 운영 조치 전까지 지속된다.

### 조치 필요 항목

**① 차트 비교선 (`/stock/:symbol` → 차트 탭)**

`benchmarks` 배열이 비어있을 때 KOSPI 비교선을 렌더링하지 않는다.
현재 빈 배열에 대한 처리가 없으면 빈 데이터로 선을 그리거나 에러가 발생할 수 있다.

```typescript
// 차트 컴포넌트에서
const hasBenchmarkData = benchmarks && benchmarks.length > 0;

// 비교선 렌더링 조건부 처리
{hasBenchmarkData && (
  <Line dataKey="benchmarkReturn" name="KOSPI" ... />
)}
```

**② 수익률 카드 (`benchmarkReturnRate: 0`)**

`benchmarkReturnRate`가 0일 때 "KOSPI 대비 0%" 표시가 데이터 없음과 구분되지 않는다.
단기: `benchmarkReturnRate === 0`이면 비교 수익률 표시 자체를 숨기거나 "데이터 없음"으로 표시.

```typescript
// 수익률 카드 컴포넌트
{benchmarkReturnRate !== 0 ? (
  <span>KOSPI 대비 {benchmarkReturnRate}%</span>
) : (
  <span className="text-muted">벤치마크 데이터 없음</span>
)}
```

> 백엔드 벤치마크 데이터 적재 후 정상 표시 확인 필요.

---

## 🟡 MAJOR 2: 종목 상세 — `period` 파라미터 타입 안전성

### 현상

백엔드가 잘못된 `period` 값을 `1Y`로 silently fallback한다.
FE에서 잘못된 값을 전달하더라도 오류가 발생하지 않아 버그 탐지가 어렵다.

**백엔드에서 `period=INVALID` 시 400 반환으로 수정 예정.**

### FE 사전 조치

허용된 `period` 값을 상수 또는 union 타입으로 고정해 컴파일 시점에 잘못된 값을 차단한다.

```typescript
// src/types/api.ts 또는 stock.ts
export type ChartPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";
export type ChartFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
```

```typescript
// stockApi.getPriceHistory 시그니처
getPriceHistory: async (
  ticker: string,
  period: ChartPeriod = "1Y",
  frequency: ChartFrequency = "DAILY"
): Promise<StockPriceHistoryResponse>
```

---

## ⚠️ 데이터: 인기 검색어 빈 배열

`GET /api/v1/stocks/popular-search` → `data: []`

배치 미실행으로 Redis에 인기 검색어 없는 상태.
FE는 이미 `catch(() => [])` fallback 처리 중 ✅
배치 실행 후 자동 표시. 별도 조치 불필요.

---

## 수정 우선순위 요약

| 우선순위 | 파일 | 수정 내용 |
|---------|------|----------|
| 🔴 즉시 | `src/hooks/use-stock.ts:27` | `lastPage.hasNext` → `!lastPage.last` (BE 배포 전 임시) |
| 🔴 확인 | `src/api/client.ts` | 401 재시도 `_retry` 플래그 존재 여부 확인 |
| 🟡 단기 | 차트 컴포넌트 | `benchmarks.length === 0` 시 비교선 미렌더링 |
| 🟡 단기 | 수익률 카드 컴포넌트 | `benchmarkReturnRate === 0` 시 "데이터 없음" 표시 |
| 🟡 단기 | `src/types/api.ts` 또는 `stock.ts` | `ChartPeriod`, `ChartFrequency` union 타입 추가 |

---

## BE 수정 배포 후 재검증 항목

- [ ] 무한 스크롤 동작 (`hasNext` 필드 존재 후 `lastPage.hasNext` 원복 여부 확인)
- [ ] 타인 포트폴리오 접근 시 403 처리 (로그인 리다이렉트 미발생 확인)
- [ ] 벤치마크 데이터 적재 후 차트 비교선 및 수익률 카드 표시
- [ ] 잘못된 period 전달 시 에러 토스트 표시 (400 수신 후 처리 확인)
