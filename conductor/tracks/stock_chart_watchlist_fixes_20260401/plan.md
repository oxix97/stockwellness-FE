# Implementation Plan: 주식 차트 및 관심 종목 기능 오류 수정

## Phase 1: 주봉(1W) 차트 데이터 정합성 수정
- [ ] Task: 주봉 차트 데이터 오류 분석 및 재현 테스트 작성
    - [ ] `src/api/__tests__/stock.test.ts` 에서 주봉 데이터 요청 및 응답 데이터 검증 케이스 추가
    - [ ] `src/app/components/screens/__tests__/StockDetail.test.tsx` (없을 경우 생성) 에서 차트 렌더링 검증 테스트 작성
- [ ] Task: 주봉 데이터 정합성 오류 수정
    - [ ] `src/api/stock.ts` 에서 주봉 데이터 파싱 로직 검증 및 수정
    - [ ] `src/hooks/use-stock.ts` 에서 차트용 데이터 변환 로직 수정 (필요 시)
- [ ] Task: 차트 렌더링 보완
    - [ ] `src/app/components/screens/StockDetail.tsx` (또는 해당 차트 컴포넌트) 에서 데이터 누락 시 렌더링 예외 처리 추가
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 주봉 차트 수정' (Protocol in workflow.md)

## Phase 2: 관심 종목 기능 고도화
- [ ] Task: 관심 종목 하트 아이콘 및 기능 테스트 작성 (Red Phase)
    - [ ] `src/hooks/__tests__/use-watchlist.test.tsx` 에서 추가/제거 및 상태 반영 테스트 케이스 작성
    - [ ] `src/app/components/screens/__tests__/StockDetail.watchlist.test.tsx` 생성하여 하트 아이콘 클릭 상호작용 테스트 작성
- [ ] Task: 관심 종목 추가/제거 기능 구현 및 상태 동기화
    - [ ] `src/api/watchlist.ts` 의 API 연동 함수 확인 및 수정
    - [ ] `src/hooks/use-watchlist.ts` 에서 관심 종목 상태(Red Heart) 실시간 반영 로직 고도화 (TanStack Query 캐시 무효화 등)
- [ ] Task: StockDetail 화면 UI 연동 및 피드백 추가
    - [ ] `src/app/components/screens/StockDetail.tsx` 에서 하트 아이콘 상태 및 클릭 핸들러 연결
    - [ ] 성공/실패 시 `sonner` 토스트 알림 추가
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 관심 종목 기능 고도화' (Protocol in workflow.md)
