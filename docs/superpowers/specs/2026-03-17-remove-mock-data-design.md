# Remove Mock Data and Integrate API Design Spec

## Overview
현재 프론트엔드 프로젝트 내에 하드코딩(Mocking)되어 있는 데이터들을 실제 백엔드 API와 연동하기 위한 설계 및 이슈 작성 계획입니다. 작업의 범위를 명확히 하고, 변경 영향을 최소화하기 위해 도메인/페이지별로 3개의 독립적인 Issue로 분리하여 진행합니다.

## Issue 1: Home 화면의 AI 추천 섹터 실데이터 연동
**목표:** `src/app/components/screens/Home.tsx`의 `SECTORS` 하드코딩 데이터를 제거하고 API 연동.
- **분석:** 현재 `Home.tsx` 파일 내부에 상수로 `SECTORS`가 정의되어 있음.
- **요구사항:**
  - 백엔드에 '추천 섹터'를 가져오는 API 엔드포인트 확인 및 `src/api/stock.ts` (또는 `portfolio.ts`)에 API 호출 함수 추가.
  - `src/hooks/use-stock.ts`에 해당 데이터를 페칭하는 React Query 커스텀 훅(`useRecommendedSectors` 등) 추가.
  - `Home.tsx`에서 하드코딩 데이터 대신 커스텀 훅을 사용하여 데이터 렌더링.
  - 로딩 상태(`isLoading`) 처리를 위한 Skeleton UI 추가/수정.

## Issue 2: Portfolio 화면의 보유 주식 목록 실데이터 연동
**목표:** `src/app/components/screens/Portfolio.tsx`의 `HOLDINGS` 하드코딩 데이터를 제거하고 API 연동.
- **분석:** `Portfolio.tsx`에 `HOLDINGS` 배열이 하드코딩되어 평가 금액 및 수익률과 별개로 UI 렌더링에 사용됨.
- **요구사항:**
  - 사용자 포트폴리오의 상세 보유 종목(Holdings) 리스트를 가져오는 API 함수(`getHoldings` 등)를 `src/api/portfolio.ts`에 추가.
  - `src/hooks/use-portfolio.ts` 내에 보유 종목 데이터를 관리하는 React Query 로직 연동 (또는 기존 `valuation` 응답에 포함되어 있다면 이를 활용하도록 수정).
  - `Portfolio.tsx` 컴포넌트의 `HoldingsList`에 실제 데이터 바인딩.
  - 빈 배열(보유 종목 없음)일 경우의 Empty State UI 구현 여부 체크.

## Issue 3: Watchlist 화면의 관심 종목(찜) 실데이터 연동
**목표:** `src/app/components/screens/Watchlist.tsx`의 `groups` 및 `watchlistStocks` 하드코딩 데이터를 제거하고 API 연동.
- **분석:** 관심 종목 그룹(`groups`)과 각 그룹별 종목 리스트(`watchlistStocks`)가 컴포넌트 내에 하드코딩 됨.
- **요구사항:**
  - 사용자의 관심 종목 그룹 및 종목 리스트를 가져오는 API(`getWatchlist` 등)를 `src/api/stock.ts` 등에 작성.
  - 데이터를 가져오고 관리하는 `useWatchlist` 등의 커스텀 훅 생성 (React Query).
  - `Watchlist.tsx`에서 하드코딩된 변수를 지우고 훅을 통해 데이터를 받아 화면에 렌더링하도록 수정.
  - 로딩 스켈레톤 및 빈 리스트 처리 로직 추가.

## Data Flow
- **API Layer (`src/api/*`)**: Axios를 이용한 순수 비동기 데이터 패칭 로직.
- **Hook Layer (`src/hooks/*`)**: `useQuery`를 이용한 서버 상태 관리 및 캐싱 (관심사 분리).
- **View Layer (`src/app/components/screens/*`)**: 데이터를 주입받아 렌더링, 로딩/에러/Empty 상태 처리.
