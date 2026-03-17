# Remove Mock Data and Integrate API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home(추천 섹터), Portfolio(보유 주식), Watchlist(관심 종목) 화면의 하드코딩된 모킹 데이터를 실제 API 연동으로 대체하고, 이를 3개의 GitHub Issue로 나누어 관리할 수 있도록 준비합니다.

**Architecture:** `src/api`에 Axios 기반 API 호출 함수 추가 -> `src/hooks`에 React Query(`useQuery`) 커스텀 훅 추가 -> `src/app/components/screens` 파일들에서 데이터 주입 및 로딩/에러/Empty 상태 처리. (관심사 분리 준수)

**Tech Stack:** React 19, TypeScript, Axios, TanStack Query v5

---

### Task 1: Create GitHub Issues (Manual Step via CLI or Web)

**Files:** None

- [ ] **Step 1: Create Issue for Home Screen**
  - Title: `[FE] Home 화면 추천 섹터 API 연동 및 모킹 데이터 제거`
  - Body: `src/app/components/screens/Home.tsx`의 `SECTORS` 상수를 제거하고, 백엔드 API를 통해 추천 섹터 데이터를 받아오도록 수정합니다. (`src/api/stock.ts`, `use-stock.ts` 활용)
- [ ] **Step 2: Create Issue for Portfolio Screen**
  - Title: `[FE] Portfolio 화면 보유 주식 목록 API 연동 및 모킹 데이터 제거`
  - Body: `src/app/components/screens/Portfolio.tsx`의 `HOLDINGS` 하드코딩 배열을 지우고, 사용자의 실제 보유 종목을 렌더링하도록 수정합니다. (`src/api/portfolio.ts`, `use-portfolio.ts` 활용)
- [ ] **Step 3: Create Issue for Watchlist Screen**
  - Title: `[FE] Watchlist 화면 관심 종목 그룹 및 리스트 API 연동`
  - Body: `src/app/components/screens/Watchlist.tsx`의 `groups` 및 `watchlistStocks` 변수를 제거하고 실제 관심 종목 API와 연동합니다.

---

### Task 2: Home Screen - Integrate Recommended Sectors (Issue 1)

**Files:**
- Modify: `src/api/stock.ts`
- Modify: `src/hooks/use-stock.ts`
- Modify: `src/app/components/screens/Home.tsx`

- [ ] **Step 1: API 함수 추가 (`src/api/stock.ts`)**
  - `getRecommendedSectors` 함수 추가 (엔드포인트: `/v1/stocks/sectors/recommended` 가정)
- [ ] **Step 2: React Query 훅 추가 (`src/hooks/use-stock.ts`)**
  - `const recommendedSectors = useQuery(...)` 추가 및 리턴 객체에 포함
- [ ] **Step 3: UI 컴포넌트 수정 (`src/app/components/screens/Home.tsx`)**
  - 하드코딩된 `SECTORS` 배열 제거
  - `useStock()` 훅에서 `recommendedSectors` 가져와서 사용
  - 데이터가 로딩 중일 때 Skeleton 처리 로직 추가

---

### Task 4: Portfolio Screen - Integrate Holdings List (Issue 2)

**Files:**
- Modify: `src/api/portfolio.ts`
- Modify: `src/hooks/use-portfolio.ts`
- Modify: `src/app/components/screens/Portfolio.tsx`

- [ ] **Step 1: API 함수 추가 (`src/api/portfolio.ts`)**
  - `getHoldings(portfolioId: string)` 함수 추가 (엔드포인트: `/v1/portfolios/${portfolioId}/holdings` 가정)
- [ ] **Step 2: React Query 훅 추가 (`src/hooks/use-portfolio.ts`)**
  - `const holdings = useQuery(...)` 추가 및 리턴 객체에 포함
- [ ] **Step 3: UI 컴포넌트 수정 (`src/app/components/screens/Portfolio.tsx`)**
  - 하드코딩된 `HOLDINGS` 배열 제거
  - `usePortfolio()`에서 `holdings.data`를 가져와 `HoldingsList`에 프롭스로 전달
  - 데이터가 없거나 로딩 중일 때 UI 처리 추가

---

### Task 5: Watchlist Screen - Integrate Watchlist Data (Issue 3)

**Files:**
- Modify: `src/api/stock.ts` (or create `src/api/watchlist.ts`)
- Create: `src/hooks/use-watchlist.ts`
- Modify: `src/app/components/screens/Watchlist.tsx`

- [ ] **Step 1: API 함수 추가**
  - `getWatchlistGroups` 및 `getWatchlistItems` 함수 추가
- [ ] **Step 2: React Query 훅 추가 (`src/hooks/use-watchlist.ts`)**
  - `useWatchlist` 커스텀 훅 작성
- [ ] **Step 3: UI 컴포넌트 수정 (`src/app/components/screens/Watchlist.tsx`)**
  - `groups` 및 `watchlistStocks` 변수 제거
  - 커스텀 훅을 통해 데이터를 받아 화면에 렌더링하고 로딩 스켈레톤 추가
