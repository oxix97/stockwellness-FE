# 배포 후 할 일

> 작성일: 2026-03-28
> 대상: BE 배포 완료 이후 프론트엔드에서 처리해야 할 작업 목록

---

## 배포 트리거별 작업 목록

| BE 배포 항목 | FE 작업 | 파일 | 이슈 |
|---|---|---|---|
| SliceResponse DTO 배포 | `!lastPage.last` → `lastPage.hasNext` 원복 | `src/hooks/use-stock.ts` | [#123](https://github.com/oxix97/stockwellness-FE/issues/123) |
| PortfolioAccessDeniedException 403 배포 | `_retry` 방어 코드 재검증 | `src/api/client.ts` | [#124](https://github.com/oxix97/stockwellness-FE/issues/124) |
| benchmarkReturnRate null 시맨틱 배포 | 조건 로직 단순화 | `BacktestResult.tsx`, `StockDetail.tsx` | [#132](https://github.com/oxix97/stockwellness-FE/issues/132) |
| openapi3 재생성 | `schema.d.ts` 갱신 | `src/types/schema.d.ts` | [#130](https://github.com/oxix97/stockwellness-FE/issues/130) |
| 벤치마크 배치 데이터 적재 | 비교선·수익률 카드 QA | `StockDetail.tsx`, `BacktestResult.tsx` | — |

---

## 상세 작업

### 1. 검색 무한 스크롤 원복 — Issue #123

**트리거:** BE `SliceResponse<T>` DTO 배포 완료

**파일:** `src/hooks/use-stock.ts:27`

현재 임시 대응으로 `!lastPage.last`를 사용 중. BE가 `hasNext` 필드를 명시적으로 반환하면 원복.

```diff
- // TODO(#123): BE SliceResponse 배포 후 lastPage.hasNext 로 원복 (hasNext === !last)
- getNextPageParam: (lastPage: StockSearchResponse) => (!lastPage.last ? lastPage.number + 1 : undefined),
+ getNextPageParam: (lastPage: StockSearchResponse) => (lastPage.hasNext ? lastPage.number + 1 : undefined),
```

`src/types/api.ts`의 `StockSearchResponse` 주석도 함께 정리:

```diff
- /** BE SliceResponse 배포 후 추가될 명시적 필드 (현재 응답에 없음 — !last로 임시 대응 중) */
+ /** BE SliceResponse hasNext 필드 */
  hasNext: boolean;
```

**검증:**
- [ ] 검색어 입력 후 스크롤 시 두 번째 페이지 로드
- [ ] 마지막 페이지에서 추가 요청 없음

---

### 2. 403 에러 처리 재검증 — Issue #124

**트리거:** BE `PortfolioAccessDeniedException`을 403(A002)으로 수정 배포

현재 `client.ts`의 `_retry` 플래그가 401 루프를 방어하고 있음. BE가 타인 포트폴리오 접근 시 403을 반환하면 인터셉터가 재발급 시도 없이 즉시 에러를 전달하므로 방어 코드가 자동 해소됨.

**확인 사항:**
- `client.ts` 인터셉터에서 403 응답 처리 로직 존재 여부 확인
- 필요 시 403 전용 에러 메시지("접근 권한이 없습니다.") 토스트 추가

**검증:**
- [ ] 타인 포트폴리오 접근 시 루프 없이 단일 에러 처리
- [ ] 정상 만료 토큰 → 재발급 + 재시도 정상 동작

---

### 3. benchmarkReturnRate null 시맨틱 처리 — Issue #132

**트리거:** BE가 데이터 없음을 `null`, 실제 0% 수익률을 `0`으로 명확히 구분해 반환

현재 `benchmarkReturnRate === 0`을 "데이터 없음"으로 처리 중이나, 실제 0%인 경우를 구분할 수 없음.

**`BacktestResult.tsx:89`**

```diff
- // TODO(BE): benchmarkReturnRate가 0일 때 데이터 없음인지 실제 0%인지 BE가 null로 명확히 구분해야 함
- const hasBenchmarkReturn = (metrics?.benchmarkReturn ?? 0) !== 0;
+ const hasBenchmarkReturn = metrics?.benchmarkReturn != null;
```

**`src/app/components/screens/BacktestResult.tsx` — ChartSection**

```diff
- const hasBenchmarkData = data.some((r) => (r.benchmarkReturnRate ?? 0) !== 0);
+ const hasBenchmarkData = data.some((r) => r.benchmarkReturnRate != null);
```

**`src/app/components/screens/StockDetail.tsx` — ComparisonSection**

```diff
- {benchRate != null && benchRate !== 0
-   ? `${benchRate > 0 ? "+" : ""}${benchRate}%`
-   : <span className="text-muted-foreground font-medium">데이터 없음</span>}
+ {benchRate != null
+   ? `${benchRate > 0 ? "+" : ""}${benchRate}%`
+   : <span className="text-muted-foreground font-medium">데이터 없음</span>}
```

**검증:**
- [ ] 벤치마크 없음 → null 수신 시 "데이터 없음" 표시
- [ ] 실제 0% 벤치마크 수익률 → "+0.00%" 표시
- [ ] 양수/음수 벤치마크 수익률 정상 표시

---

### 4. schema.d.ts 갱신 — Issue #130

**트리거:** BE REST Docs 테스트 수정 및 openapi3 재생성

```bash
# 1. BE 프로젝트에서 openapi3 생성
./gradlew :stockwellness-api:test openapi3

# 2. 생성된 spec을 서버에 노출하거나 파일 복사
# (현재 빌드 스크립트가 http://localhost:8080/docs/openapi3.yaml 을 참조)

# 3. FE에서 schema.d.ts 재생성
npm run build  # sync-api 스텝이 자동 실행
```

재생성 후 확인:
- [ ] `benchmarkReturnRate` 필드 타입이 `number | null`로 변경되어 있는지 확인
- [ ] `hasNext` 필드가 명시적으로 포함되는지 확인
- [ ] 수동 편집 흔적(`// ← 추가` 등) 없이 깨끗한 상태인지 확인
- [ ] `npm run build` TypeScript 컴파일 통과

---

### 5. 벤치마크 배치 데이터 적재 후 QA

**트리거:** BE 벤치마크(SPY/KOSPI) 배치 데이터 적재 완료

BE에서 벤치마크 데이터가 실제로 채워지면 현재 "데이터 없음" 처리가 작동하는 모든 화면을 다시 검증해야 함.

**검증 항목:**

| 화면 | 항목 | 예상 결과 |
|------|------|-----------|
| 백테스트 결과 | 차트 비교선 | SPY 점선 표시 |
| 백테스트 결과 | 벤치마크 대비 수익 | `+X.X%` 표시 |
| 백테스트 결과 | Beta 지표 | 0.5 ~ 1.5 범위의 합리적 값 |
| 종목 상세 | 차트 KOSPI 비교선 | 점선 표시 |
| 종목 상세 수익률 카드 | KOSPI 대비 수익률 | `+X.X%` 또는 `-X.X%` 표시 |
| 포트폴리오 시뮬레이션 탭 | 수익률 비교 차트 | S&P500 비교선 표시 |

---

## 배포 전 유지해야 할 임시 대응 목록

현재 BE 응답과의 불일치를 임시로 처리하는 코드. **배포 전까지 변경 금지.**

| 파일 | 위치 | 내용 | 원복 조건 |
|------|------|------|-----------|
| `src/hooks/use-stock.ts` | line 27 | `!lastPage.last` (hasNext 대신) | BE SliceResponse 배포 |
| `src/app/components/screens/BacktestResult.tsx` | line 90 | `!== 0` 조건으로 데이터 없음 판단 | BE null 시맨틱 배포 |
| `src/app/components/screens/StockDetail.tsx` | ComparisonSection | `!== 0` 조건으로 데이터 없음 판단 | BE null 시맨틱 배포 |
| `src/app/components/screens/BacktestResult.tsx` | ChartSection | `!== 0` 조건으로 비교선 분기 | BE null 시맨틱 배포 |

---

## 배포 후 전체 재검증 체크리스트

### 기능 검증

- [ ] 검색 후 스크롤 — 두 번째 페이지 로드 확인
- [ ] 검색 마지막 페이지 — 추가 요청 없음
- [ ] 만료 토큰 → 재발급 + 재시도 정상 동작
- [ ] 타인 포트폴리오 접근 → 루프 없이 단일 에러 처리
- [ ] 백테스트 — 벤치마크 데이터 없음 → "벤치마크 데이터 없음" 표시
- [ ] 백테스트 — 벤치마크 데이터 있음 → 비교선 + 수익 정상 표시
- [ ] 백테스트 성과 지표 — CAGR, MDD, Sharpe, Beta 합리적 값 표시
- [ ] 종목 상세 — 벤치마크 없음 → 비교선 미표시
- [ ] 종목 상세 — 벤치마크 있음 → KOSPI 비교선 정상 표시
- [ ] 종목 상세 수익률 카드 — 벤치마크 null 시 "데이터 없음" 표시
- [ ] 포트폴리오 시뮬레이션 탭 — 기간 탭 변경 시 차트 반영

### 타입 검증

- [ ] `schema.d.ts` 재생성 후 `npm run build` 컴파일 통과
- [ ] `benchmarkReturnRate` 타입이 `number | null`인지 확인
- [ ] `StockSearchResponse.hasNext` 필드 명시적 포함 여부 확인
