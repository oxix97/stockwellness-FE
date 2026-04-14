# 포트폴리오 API 정합성 구현 계획

## Phase 1: API Layer & Type Alignment
- [ ] Task: 포트폴리오 메인 화면 및 관련 Hook들이 `src/api/portfolioApi.ts` 대신 `src/api/portfolio.ts`와 `@/types/api`를 사용하도록 import 및 타입 변경
- [ ] Task: 메인 화면에서 `summary`, `portfolios/{id}`, `health`, `advice`, `inception/chart` 조합의 API 호출 구조가 올바르게 유지되는지 확인
- [ ] Task: Conductor - User Manual Verification 'Phase 1: API Layer & Type Alignment' (Protocol in workflow.md)

## Phase 2: Diversification Widget (분산도 차트)
- [ ] Task: Write Failing Tests (Red Phase) - `DiversificationWidget` 유닛 테스트에서 데이터가 `category/ratio` 대신 `name/value` 기준으로 렌더링되기를 기대하도록 테스트 수정
- [ ] Task: Implement to Pass Tests (Green Phase) - `DiversificationWidget` 컴포넌트의 차트 렌더링 로직을 `name/value` 기준으로 수정
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Diversification Widget' (Protocol in workflow.md)

## Phase 3: Rebalancing Widget (리밸런싱 위젯)
- [ ] Task: Write Failing Tests (Red Phase) - `RebalancingWidget` 유닛 테스트에서 `rebalancing.lastUpdated` 프로퍼티 없이도 정상적으로 렌더링되기를 기대하도록 테스트 수정
- [ ] Task: Implement to Pass Tests (Green Phase) - `RebalancingWidget` 컴포넌트 내에서 `lastUpdated` 의존성 및 관련 UI 표시 로직 제거
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Rebalancing Widget' (Protocol in workflow.md)

## Phase 4: Simulation Widget (시뮬레이션 차트)
- [ ] Task: Write Failing Tests (Red Phase) - `SimulationWidget` 유닛 테스트에서 벤치마크 라인의 `dataKey`로 `indexName`이 아닌 `ticker`를 사용하도록 테스트 수정
- [ ] Task: Implement to Pass Tests (Green Phase) - `SimulationWidget` 컴포넌트 내 Recharts `Line` 컴포넌트의 `dataKey`를 `ticker`로 변경
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Simulation Widget' (Protocol in workflow.md)

## Phase 5: API Mocking & Final Check
- [ ] Task: MSW 또는 API 모킹 핸들러(`src/mocks` 등)의 포트폴리오 관련 응답 데이터를 새로운 스키마 구조에 맞게 업데이트
- [ ] Task: 전체 단위 테스트 스위트 실행 및 통과 확인
- [ ] Task: Conductor - User Manual Verification 'Phase 5: API Mocking & Final Check' (Protocol in workflow.md)