# Search Tab Code Review Plan

## Objective
종목 검색(Search) 탭의 현재 구현 상태를 점검하고, 기획 명세(인기/최근 검색어, 무한 스크롤, 디바운스)에 따른 기능적 완성도와 코드 품질을 확보하기 위한 리뷰를 수행한다. 특히 중복된 훅 구조를 정리하고 성능 최적화 포인트를 식별한다.

## Key Files & Context
- **Screen**: `src/app/components/screens/Search.tsx`
- **Hooks**: `src/hooks/use-stock.ts` (현재 사용 중), `src/hooks/use-search.ts` (중복/방치 여부 확인 필요)
- **API**: `src/api/stock.ts` (`stockApi.search`, `popular-search` 등)
- **Spec**: `../docs/specs/stock-search.md`

## Review Items

### 1. 기능적 정합성 및 기획 준수 (Functional Correctness)
- [ ] **무한 스크롤(Infinite Scroll)**: 검색 결과 리스트 하단 도달 시 `fetchNextPage`가 정상적으로 트리거되는지 확인. (현재 `SearchResultsList`에 감지 로직 누락 의심)
- [ ] **디바운스(Debounce) 적용**: 검색어 입력 시 300ms 이상의 디바운스가 적용되어 불필요한 API 호출을 방지하는지 확인.
- [ ] **최근 검색어 연동**: 기획상 '미연동(localStorage)'이나 코드상 'API' 로직이 혼재됨. 현재 시점의 요구사항에 맞춰 단일화된 저장 방식(또는 fallback)을 사용하는지 확인.
- [ ] **최소 글자 수 제한**: 검색어 2자 미만일 때 검색 수행 방지 및 이전 상태(인기/최근 검색어) 유지 여부.

### 2. UI/UX 및 스타일링 (UI/UX & Styling)
- [ ] **에러/빈 상태 처리**: 검색 결과가 없을 때의 "검색 결과가 없어요" UI와 API 에러 시의 대응 로직.
- [ ] **로딩 상태(Skeleton)**: 검색 중 및 추가 페이지 로딩 시의 스켈레톤 UI가 레이아웃을 해치지 않는지 확인.
- [ ] **터치 타겟 및 모바일 최적화**: 검색 결과 아이템의 클릭 영역(최소 44px)과 모바일 웹 환경에서의 레이아웃 안정성.

### 3. 코드 품질 및 아키텍처 (Code Quality)
- [ ] **훅 구조 최적화**: `use-search.ts`와 `use-stock.ts` 내 검색 로직 중복 해결. 하나의 표준화된 검색 훅으로 통합 권고.
- [ ] **Query Key 관리**: `stockKeys` 등 팩토리 함수를 사용하여 Query Key의 일관성을 유지하는지 확인.
- [ ] **부수 효과 관리**: 검색어 입력 시 `useEffect`를 통한 최근 검색어 자동 저장 로직의 타이밍과 성능 영향 평가.

### 4. 성능 및 안정성 (Stability)
- [ ] **메모리 누수 및 타이머 관리**: `setTimeout` 사용 시 `clearTimeout`이 적절히 이루어지는지 확인.
- [ ] **타입 안전성**: `StockSearchResponse` Slice 구조와 무한 쿼리 파라미터 타입의 일치 여부.

## Verification & Testing
- **Unit Test**: `src/hooks/__tests__/use-search.test.tsx` (작성 필요 시 제안)
- **Manual Check**: 브라우저 네트워크 탭을 통한 디바운스 및 무한 스크롤 API 호출 횟수 검증.
- **E2E Test**: `tests/search.e2e.spec.ts`를 통한 검색 흐름 자동화 테스트.
