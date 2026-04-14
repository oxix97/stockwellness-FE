# 포트폴리오 API 정합성 작업 명세서

## 개요
포트폴리오 화면이 현재 백엔드 계약을 정확히 해석하도록 프론트 API 소비 구조와 화면 구현을 정리합니다. 기존 deprecated 호환 레이어의 사용을 중단하고 신규 API 레이어(`src/api/portfolio.ts`)를 기준으로 대시보드 위젯을 마이그레이션합니다.

## 기능 요구 사항
1. **메인 화면 호출 구조 유지**: 
   - `GET /analysis/summary`, `GET /portfolios/{id}`, `GET /health`, `GET /advice/latest` (404 시 `POST /advice`), `GET /analysis/performance/inception/chart` 조합 유지.
2. **응답 스키마 해석 수정**:
   - 분산도 차트(`DiversificationWidget`): `category/ratio` 대신 `name/value` 기준으로 렌더링.
   - 리밸런싱 위젯(`RebalancingWidget`): `rebalancing.lastUpdated` 의존성 제거.
   - 시뮬레이션 차트(`SimulationWidget`): 벤치마크 라인의 `dataKey`를 `indexName`에서 `ticker`로 변경.
3. **API 레이어 및 재사용 원칙 정리**:
   - 포트폴리오 API 진입점은 `src/api/portfolio.ts` 사용.
   - `src/api/portfolioApi.ts`, `src/types/portfolio.ts`는 새로운 기능에서 사용 금지(Deprecated). 신규 코드는 `@/types/api` 기준 타입 사용.
   - 메인 화면과 바텀시트는 `summary + correlation + inception chart` 조합을 우선 사용하며, 상세 진단/분석 진입 시에만 추가 호출 수행.

## 비기능 요구 사항
- 문제 발생 시 롤백 전략은 표준 `Git Revert`에 의존합니다.

## 테스트 및 검증 요구 사항
- **위젯 단위 테스트 검증**:
   - `DiversificationWidget`가 `name/value`를 사용하는지 검증.
   - `RebalancingWidget`가 `lastUpdated` 없이 렌더링되는지 검증.
   - `SimulationWidget`가 벤치마크 라인 `dataKey`로 `ticker`를 사용하는지 검증.
- **Hook 및 위젯 유닛 테스트 업데이트**: `usePortfolioSummary`, `usePortfolioAdvice`, `usePortfolioSimulation`의 기존 테스트 보강.
- **API 모킹(MSW)**: 새로운 API 응답 스키마에 맞춰 모킹 데이터 업데이트.

## 범위 외 (Out of Scope)
- 대시보드 위젯 이외의 기존 `portfolioApi.ts` 사용 컴포넌트 전체 마이그레이션.
- E2E 테스트(Playwright) 업데이트.
- 메인 화면 및 건강 진단 화면의 API 호출 수 절감을 위한 신규 API 추가 (추후 별도 협의).