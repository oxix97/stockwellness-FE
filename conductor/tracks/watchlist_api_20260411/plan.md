# Implementation Plan: Watchlist API Integration & UI Implementation

## Phase 1: API Client & Types Setup [checkpoint: a7c37ce]
- [x] Task: `src/types/api.ts`에 WatchlistGroup, WatchlistItemDetail, WatchlistItemListResponse 타입 인터페이스 정의 5f1042f
- [x] Task: `src/api/watchlist.ts`에 그룹 관리(POST, GET, PATCH, DELETE) 및 종목 관리(POST, GET, DELETE, PATCH) API 통신 로직 구현 5f1042f
- [x] Task: `docs/query-keys.md` 및 관련 파일에 Watchlist API를 위한 React Query Key Factory 정의 5f1042f
- [x] Task: Conductor - User Manual Verification 'Phase 1: API Client & Types Setup' (Protocol in workflow.md) a7c37ce

## Phase 2: Custom Hooks (useWatchlist)
- [ ] Task: `src/hooks/use-watchlist.ts` 생성 후 그룹 관리(조회, 추가, 수정, 삭제)를 위한 `useQuery`, `useMutation` 훅 구현
- [ ] Task: 그룹 관리에 대한 낙관적 업데이트(Optimistic Updates) 로직(`onMutate`, `onError`, `onSettled` 등) 구현
- [ ] Task: `use-watchlist.ts`에 종목 관리(추가, 삭제) 및 메모 수정(PATCH) 훅과 낙관적 업데이트 로직 추가
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Custom Hooks (useWatchlist)' (Protocol in workflow.md)

## Phase 3: Watchlist UI & Bottom Sheet Navigation
- [ ] Task: `src/app/components/watchlist/WatchlistBottomSheet.tsx` 구현하여 바텀 시트 기반의 그룹 네비게이션 적용
- [ ] Task: 메인 Watchlist 화면(`src/app/components/screens/Watchlist.tsx`)에 바텀 시트 통합
- [ ] Task: 그룹 생성, 이름 변경, 삭제를 처리하는 UI(`WatchlistGroupManager.tsx` 또는 관련 컴포넌트) 구현
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Watchlist UI & Bottom Sheet Navigation' (Protocol in workflow.md)

## Phase 4: Item List & Note Editing UI
- [ ] Task: 개별 종목 정보(티커, 가격, RSI, AI 인사이트, 메모)를 렌더링하는 `WatchlistItemCard.tsx` 컴포넌트 구현
- [ ] Task: 선택된 활성 그룹의 종목 리스트를 렌더링하도록 메인 Watchlist 화면 업데이트
- [ ] Task: 각 항목의 메모(Note)를 인라인 혹은 다이얼로그 형태로 수정할 수 있는 UI 통합
- [ ] Task: 카드 컴포넌트에 스와이프 혹은 액션 메뉴를 통한 종목 삭제 기능 추가
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Item List & Note Editing UI' (Protocol in workflow.md)