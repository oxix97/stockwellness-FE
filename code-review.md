# 코드 리뷰 — API 연동 버그 수정 및 안정화

> 작성일: 2026-03-28
> 대상 이슈: [Epic #132](https://github.com/oxix97/stockwellness-FE/issues/132) (검색·종목 상세·백테스트 API 연동 수정)
> 변경 파일: `src/types/api.ts`, `src/api/stock.ts`, `src/hooks/use-stock.ts`, `src/hooks/use-backtest.ts`, `src/app/components/screens/BacktestResult.tsx`, `src/app/components/screens/StockDetail.tsx`

---

## 리뷰 결과 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| 🔴 BLOCKER | 1 | ✅ 해소 (hasBenchmarkReturn 조건 + TODO 명시) |
| 🟡 MAJOR | 3 | ✅ 모두 해소 |
| 🟢 MINOR | 3 | ✅ 모두 해소 |
| ⚠️ 잔여 | 1 | `SimulationTab.tsx` 기존 에러 — 별도 이슈 관리 |

---

## 🔴 BLOCKER

### B-1: `benchmarkReturnRate === 0` — 실제 0% 수익률 vs 데이터 없음 구분 ✅ 해소

**조치 내용:**

- `BacktestResult.tsx`: `hasBenchmarkReturn` 플래그로 "벤치마크 데이터 없음" 표시 분기
- `StockDetail.tsx` `ComparisonSection`: `benchRate !== 0` 조건 유지 + 한계 인지
- `TODO(BE)` 주석 추가 — BE가 데이터 없음을 `null`로 명확히 반환하면 조건 단순화 가능

```tsx
// BacktestResult.tsx
const hasBenchmarkReturn = (metrics?.benchmarkReturn ?? 0) !== 0;

{hasBenchmarkReturn ? (
  <div className="text-primary font-bold text-3xl">
    {metrics.outperformance >= 0 ? "+" : ""}{metrics.outperformance.toFixed(1)}%
  </div>
) : (
  <div className="text-muted-foreground text-sm font-medium">벤치마크 데이터 없음</div>
)}
```

> **근본 해결 필요:** BE가 데이터 없음을 `null`, 실제 0%를 `0`으로 구분해 반환하도록 BE 측에 요청.

---

## 🟡 MAJOR

### M-1: `ChartSection` `any` 타입 제거 ✅ 해소

**조치 내용:** `backtestData: any[]` → `backtestData: BacktestDailyResult[]`, `(r: any)` 제거

```tsx
// 수정 후
function ChartSection({ backtestData }: { backtestData: BacktestDailyResult[] }) {
  const hasBenchmarkData = data.some((r) => (r.benchmarkReturnRate ?? 0) !== 0);
```

---

### M-2: `serverMetrics` 미사용 → `BacktestResult.tsx` 실제 적용 ✅ 해소

**조치 내용:** 성과 지표 카드(CAGR, MDD, Sharpe, Beta)를 `serverMetrics` 우선 사용으로 변경

```tsx
const displayCagr = serverMetrics?.cagr ?? metrics?.cagr;
const displayMdd = serverMetrics?.mdd ?? metrics?.mdd;
const displaySharpe = serverMetrics?.sharpeRatio ?? metrics?.sharpeRatio;
const displayBeta = serverMetrics?.beta ?? metrics?.beta;
```

추가로 `AiCommentCard`에 전달되던 미사용 props(`metrics`, `config`) 제거 및 `any` 타입 → 명시적 타입 교체.

---

### M-3: `StockSearchResponse.number`·`last` 중복 필드 제거 ✅ 해소

**확인 결과:** 기반 스키마 `api-v1-stocks-search-1069080236`에 `number`(line 658), `last`(line 664) 필드 이미 존재.

**조치 내용:** 수동으로 추가한 중복 필드 제거, 주석만 유지

```typescript
export type StockSearchResponse = Omit<...> & {
  content: StockSearchResult[];
  /** BE SliceResponse 배포 후 추가될 명시적 필드 (현재 응답에 없음 — !last로 임시 대응 중) */
  hasNext: boolean;
  // number, last 필드는 기반 스키마에 이미 포함됨
};
```

---

## 🟢 MINOR

### m-1: 임시 대응 원복 추적 — `TODO(#123)` 태그 추가 ✅ 해소

```typescript
// TODO(#123): BE SliceResponse 배포 후 lastPage.hasNext 로 원복 (hasNext === !last)
getNextPageParam: (lastPage: StockSearchResponse) => (!lastPage.last ? lastPage.number + 1 : undefined),
```

---

### m-2: `BacktestRequest.period` 타입 ✅ string 유지 확정

BE가 해당 필드를 무시하므로 `string` 유지가 더 실용적. 변경 없음.

---

### m-3: 기존 TypeScript 에러 정리 ✅ 부분 해소

| 에러 | 조치 |
|------|------|
| `BacktestResult.tsx` — `YAxis` unused import | ✅ 제거 |
| `BacktestResult.tsx` — `AiCommentCard` `metrics`·`config` unused | ✅ props 제거 + `any` 타입 명시화 |
| `SimulationTab.tsx` — `BacktestRequest` 필수 필드 누락 | ⚠️ 별도 이슈 생성 권장 (`period`, `rebalancingPeriod` 미전달) |

---

## QA 체크리스트

### 즉시 검증 가능 (배포 없이)

- [ ] 검색 후 스크롤 시 두 번째 페이지 로드 확인
- [ ] 마지막 페이지에서 추가 요청 없음 확인
- [ ] 만료 토큰 → 재발급 + 재시도 정상 동작
- [ ] 백테스트 실행 후 `benchmarkReturnRate` 전부 0이면 차트 비교선 미표시
- [ ] 백테스트 결과 — 벤치마크 데이터 없을 때 "벤치마크 데이터 없음" 표시 (outperformance 숨김)
- [ ] 상세 성과 지표 — BE serverMetrics 값 표시 확인 (CAGR, MDD, Sharpe, Beta)
- [ ] 종목 상세 — `benchmarks: []` 응답 시 KOSPI 비교선·범례 미표시
- [ ] 종목 상세 수익률 카드 — `benchmarkReturnRate: 0` 시 "데이터 없음" 표시
- [ ] `ChartPeriod` 외 값 사용 시 TypeScript 컴파일 에러 발생 확인

### BE 배포 후 재검증

- [ ] BE SliceResponse 배포 후 `!lastPage.last` → `lastPage.hasNext` 원복 (Issue #123)
- [ ] 타인 포트폴리오 접근 시 403 처리 → 루프 없이 단일 에러
- [ ] 벤치마크 데이터 적재 후 차트 비교선 및 수익률 카드 정상 표시
- [ ] 백테스트 결과 벤치마크 대비 수익률 0이 아닌 실제 값 표시
- [ ] `beta` 지표 합리적 범위 (0.5 ~ 1.5) 확인

---

## 잔여 이슈

| 파일 | 내용 | 권장 조치 |
|------|------|-----------|
| `SimulationTab.tsx:32` | `BacktestRequest` 필수 필드(`period`, `rebalancingPeriod`) 미전달 — 런타임 오류 가능성 | 별도 이슈로 분리 |
| BE 협의 필요 | `benchmarkReturnRate: null` vs `0` 시맨틱 정의 | BE 이슈 등록 |
