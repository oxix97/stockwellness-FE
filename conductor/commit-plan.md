# 커밋 계획서 (Commit Plan)

현재 작업 디렉토리의 unstaged 변경 사항들을 기능별로 분류하여 커밋할 수 있도록 계획을 세웠습니다.

## 1. 백엔드 API 스키마 동기화 및 토큰 갱신 로직 개선
백엔드의 변경된 API 응답 스키마(SuccessEnvelope, ErrorEnvelope 등)를 반영하고, AuthStore의 토큰 갱신 로직(`updateTokens`)을 개선한 작업입니다.

* **커밋 메시지:** `refactor(auth): 백엔드 API 스키마 변경 반영 및 토큰 갱신 로직 개선`
* **포함 파일:**
  - `src/types/api.ts`
  - `src/types/schema.d.ts`
  - `src/utils/format.ts`
  - `src/store/auth.ts`
  - `src/api/client.ts`
  - `src/api/auth.ts`
  - `src/app/components/screens/AuthCallbackHandler.tsx`
  - `src/app/components/screens/__tests__/AuthCallbackHandler.test.tsx`
  - `src/api/__tests__/client.test.ts`

## 2. 홈 화면 UI 개편 및 섹터 랭킹 섹션 추가
홈 화면의 UI 레이아웃을 고도화하고, `SectorRankingSection`을 새롭게 추가하여 주요 섹터 및 시장 지수 표시를 개선한 작업입니다. 무한 스크롤 및 스와이프 UI와 E2E 테스트 수정도 포함됩니다.

* **커밋 메시지:** `feat(home): 홈 화면 UI 개편 및 섹터 랭킹 섹션 추가`
* **포함 파일:**
  - `src/api/sector.ts`
  - `src/hooks/use-sector.ts`
  - `src/app/components/home/SectorRankingSection.tsx` (Untracked)
  - `src/app/components/home/HomeCard.tsx`
  - `src/app/components/home/MarketIndexCard.tsx`
  - `src/app/components/home/NewListingsSection.tsx`
  - `src/app/components/home/SectorBottomSheet.tsx`
  - `src/app/components/home/SupplyDemandSection.tsx`
  - `src/app/components/screens/Home.tsx`
  - `src/app/components/screens/__tests__/Home.test.tsx`
  - `src/api/__tests__/sector.test.ts`
  - `src/hooks/__tests__/use-sector.limit.test.tsx`
  - `tests/layout.e2e.spec.ts`

## 3. 포트폴리오 및 관심종목 탭 렌더링 버그 수정
포트폴리오 탭에서 종목 이름(`name`)이 없을 경우 `symbol`을 표시하도록 fallback을 추가하고, 관심종목 카드의 타이머 클린업(메모리 누수 방지)을 추가한 작업입니다.

* **커밋 메시지:** `fix(portfolio): 종목명 표시 개선 및 메모리 누수 방지 타이머 클린업 추가`
* **포함 파일:**
  - `src/app/components/portfolio/tabs/CompositionTab.tsx`
  - `src/app/components/portfolio/tabs/RebalancingTab.tsx`
  - `src/hooks/use-portfolio.ts`
  - `src/app/components/watchlist/WatchlistItemCard.tsx`

## 4. 문서 정리 및 Conductor 계획 현행화
오래된 리뷰 문서(`code-review.md`)를 삭제하고, 진행 중인 작업 계획 문서들을 최신화한 작업입니다.

* **커밋 메시지:** `docs(conductor): 코드 리뷰 문서 제거 및 작업 계획 현행화`
* **포함 파일:**
  - `code-review.md` (deleted)
  - `conductor/plan.md`
  - `conductor/social-login-test-plan.md`
  - `conductor/home-error-fix-plan.md` (Untracked)