# 포트폴리오 API 정합성 작업 목록

## 목적

포트폴리오 화면이 현재 백엔드 계약을 정확히 해석하도록 프론트 API 소비 구조와 화면 구현을 정리한다.

## 프론트엔드에서 해야 할 일

### 1. 메인 화면 호출 구조 유지 (완료)

- [x] 포트폴리오 메인 진입 시 아래 조합으로 데이터를 가져오도록 유지한다.
- `GET /analysis/summary`
- `GET /portfolios/{id}`
- `GET /health`
- `GET /advice/latest` + `404` 시 `POST /advice`
- `GET /analysis/performance/inception/chart`

### 2. 응답 스키마 해석 수정 (완료)

- [x] 분산도 차트는 `category/ratio`가 아니라 `name/value` 기준으로 렌더링한다.
- [x] 리밸런싱 위젯에서 `rebalancing.lastUpdated` 의존을 제거한다.
- [x] 시뮬레이션 차트의 benchmark line은 `indexName`이 아니라 `ticker`를 `dataKey`로 사용한다.

### 3. API 재사용 원칙 정리 (완료)

- [x] 메인 화면과 바텀시트는 `summary + correlation + inception chart` 조합을 우선 사용한다.
- [x] `getDiversification`, `getRebalancing`는 별도 상세 화면이 필요한 시점까지 직접 사용하지 않는다.
- [x] 상세 진단/분석 진입 시에만 `correlation`을 추가 호출한다.

### 4. API 레이어 정리 (완료)

- [x] 포트폴리오 API 진입점은 `src/api/portfolio.ts`를 기준으로 사용한다.
- [x] `src/api/portfolioApi.ts`, `src/types/portfolio.ts`는 deprecated 호환 레이어로만 유지하고 신규 사용을 막는다.
- [x] 신규 코드에서는 항상 `@/types/api`를 기준 타입으로 사용한다.

### 5. 테스트 보강 (완료)

- [x] `usePortfolioSummary`, `usePortfolioAdvice`, `usePortfolioSimulation`의 기존 테스트를 유지한다.
- [x] 위젯 테스트에서 아래를 검증한다.
- [x] `DiversificationWidget`가 `name/value`를 사용한다.
- [x] `RebalancingWidget`가 `lastUpdated` 없이 렌더링된다.
- [x] `SimulationWidget`가 benchmark line의 `dataKey`로 `ticker`를 사용한다.

### 6. 후속 최적화 후보

- [ ] `HealthDiagnosis`는 현재 `usePortfolio()`를 통해 summary/details/health를 함께 당기고 있으므로, 이후 필요 시 전용 훅 분리 여부를 검토한다.
- [ ] 메인 화면과 건강 진단 화면의 호출 수를 더 줄일 필요가 생기면 그때 집계 API 추가 여부를 백엔드와 협의한다.
