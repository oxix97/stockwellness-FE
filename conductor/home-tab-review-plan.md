# Home Tab Code Review Plan

## Objective
홈(Home) 탭의 현재 구현 상태를 종합적으로 점검하고, 최근 진행된 UI/UX 개선 사항(상단바 제거, 섹터 리스트 가로 스크롤 및 데이터 제한 확장 등)이 기획 의도에 맞게 정확히 반영되었는지 확인하며, 코드 품질과 성능을 최적화하기 위한 리뷰를 수행한다.

## Key Files & Context
- **Screens**: `src/app/components/screens/Home.tsx`
- **Home Components**: `src/app/components/home/` (NewListingsSection, MarketIndexCard, SupplyDemandSection 등)
- **Hooks**: `src/hooks/use-sector.ts`, `src/hooks/use-stock.ts`, `src/hooks/use-market-index.ts`
- **History**: `conductor/archive/home_tab_fixes_20260401/` (최근 수정 내역)

## Review Items

### 1. 기능적 정합성 및 기획 준수 (Functional Correctness)
- [ ] **데이터 Limit 확인**: 'AI가 주목하는 섹터'의 데이터 fetch limit이 기획(10개)대로 반영되었는지 확인. (현재 `use-sector.ts`에서 `limit: 5`로 구현된 부분 수정 필요성 검토)
- [ ] **가로 스크롤 동작**: 섹터 트렌드와 신규 상장 섹션의 가로 스크롤(`overflow-x-auto`)이 의도한 대로 동작하는지 확인.
- [ ] **문서 타이틀**: 브라우저 탭 타이틀(`document.title`)이 'stockwellness'로 정상 노출되는지 확인.

### 2. UI/UX 및 스타일링 (UI/UX & Styling)
- [ ] **레이아웃 일관성**: 상단바(AppBar) 제거 후의 헤더 영역 여백 및 모바일 웹에서의 가시성 점검.
- [ ] **반응형 대응**: 가로 스크롤 영역의 패딩(`-mx-4 px-4`) 처리가 다양한 화면 크기에서 자연스러운지 확인.
- [ ] **로딩 상태 (Skeleton)**: 데이터 로딩 시 Skeleton UI가 실제 콘텐츠와 유사한 레이아웃을 유지하여 CLS(Cumulative Layout Shift)를 방지하는지 확인.

### 3. 코드 품질 및 아키텍처 (Code Quality)
- [ ] **계층 분리**: 컴포넌트에서 API 모듈을 직접 참조하지 않고 커스텀 훅을 통해 데이터를 가져오는지 확인 (GEMINI.md 준수).
- [ ] **상태 관리**: TanStack Query의 Query Key 팩토리 사용 및 `staleTime` 설정의 적절성.
- [ ] **불필요한 리렌더링**: Framer Motion 애니메이션이나 인라인 함수가 성능에 미치는 영향 평가.

### 4. 안정성 및 에러 처리 (Stability)
- [ ] **API 에러 대응**: API 호출 실패 시 빈 데이터 처리나 사용자 알림(Toast/Error UI)이 적절히 이루어지는지 확인.
- [ ] **타입 안전성**: `src/types/api.ts`에 정의된 인터페이스와 실제 데이터 흐름 간의 일치 여부.

## Verification & Testing
- **Unit Test**: `src/hooks/__tests__/` 및 `src/app/components/screens/__tests__/` (존재 시) 테스트 실행.
- **E2E Test**: `tests/layout.e2e.spec.ts` 등을 실행하여 상단바 제거 및 레이아웃 상태 검증.
- **Manual Check**: 브라우저 개발자 도구를 이용한 모바일 뷰(iPhone/Android) 환경 테스트.
