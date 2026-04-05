# Code Review: 홈 탭 (Home Tab) UI/UX 개선 및 기능 점검

## 개요
홈 탭의 최근 UI/UX 개선 사항(상단바 제거, 가로 스크롤 레이아웃 적용, 데이터 노출 제한 확장 등)에 대한 코드 리뷰 결과입니다.

## 리뷰 대상
- `src/app/components/screens/Home.tsx`
- `src/app/components/home/` 하위 컴포넌트
- `src/hooks/use-sector.ts`, `src/hooks/use-stock.ts`
- `index.html` (브라우저 타이틀)

---

## 상세 리뷰 결과

### 🔴 BLOCKER (머지 전 필수 수정)
- **해당 없음**: 현재 서비스 운영에 치명적인 결함은 발견되지 않았습니다.

### 🟡 MAJOR (강력 권고)
1. **AI 주목 섹터 데이터 Limit 불일치 (`src/hooks/use-sector.ts`)** [✅ RESOLVED]
   - **현황**: 기획서에는 섹터 노출 개수를 10개로 늘리기로 되어 있으나, 기존에는 `limit: 5`로 호출하고 있었습니다.
   - **조치**: `limit: 10`으로 수정하였으며, `use-sector.test.tsx` 테스트 코드의 기대값도 10으로 업데이트하여 정상 통과를 확인했습니다. (2026-04-05)


### 🟢 MINOR (선택 및 개선 제안)
1. **신규 상장 섹션 데이터 슬라이싱 로직 위치 (`src/app/components/home/NewListingsSection.tsx`)** [✅ RESOLVED]
   - **현황**: 기존에는 `data.slice(0, 10)`을 컴포넌트 렌더링 단계에서 처리하고 있었습니다.
   - **조치**: `useStock` 훅의 `select` 옵션을 사용하여 훅 레벨에서 10개로 제한하도록 개선하였습니다. (2026-04-05)
2. **Horizontal Scroll UI의 끝 처리 (`src/app/components/screens/Home.tsx`)**
   - **현황**: `-mx-4 px-4`와 `scrollbar-hide`를 사용하여 모바일 네이티브 앱과 유사한 스크롤 경험을 잘 구현했습니다.
   - **제안**: 마지막 아이템 뒤에 약간의 여백(예: `pr-4`)이 충분한지 실제 기기에서 확인이 필요합니다. (현재 구현상으로는 부모의 `px-4`와 자식의 `-mx-4` 조합으로 인해 적절해 보입니다.)

---

## 종합 의견
전반적으로 **상단바(AppBar) 제거**를 통한 공간 활용도 향상과 **가로 스크롤 카드 레이아웃** 도입으로 인한 가독성 개선이 훌륭합니다. 특히 `index.html`에서 브라우저 타이틀이 `stockwellness`로 정상 변경된 점이 확인되었습니다. 위 **MAJOR 사항(데이터 Limit 10개로 수정 및 테스트 정규화)**만 반영된다면 최종 승인(Approve) 가능합니다.

---
**작성자**: Gemini CLI (Senior Frontend Engineer)
**날짜**: 2026-04-05

# Code Review: 종목 검색 (Search Tab) 기능 및 아키텍처 점검

## 개요
종목 검색(Search) 화면의 기획 명세(인기/최근 검색어, 무한 스크롤, 디바운스) 준수 여부와 코드 구조의 효율성을 점검한 결과입니다.

## 리뷰 대상
- `src/app/components/screens/Search.tsx`
- `src/hooks/use-stock.ts`, `src/hooks/use-search.ts` (중복 확인)
- `src/api/stock.ts` (검색 API 파라미터)

---

## 상세 리뷰 결과

### 🔴 BLOCKER (머지 전 필수 수정)
1. **무한 스크롤 트리거 누락 (`src/app/components/screens/Search.tsx`)** [✅ RESOLVED]
   - **현황**: `useInfiniteQuery`를 사용하여 데이터를 가져오지만, 리스트 하단 도달 시 `fetchNextPage`를 호출하는 `Intersection Observer`나 "더보기" 버튼이 누락되어 있었습니다.
   - **조치**: `react-intersection-observer`를 활용하여 리스트 하단에 감지 요소를 추가하고 무한 스크롤을 활성화했습니다. (2026-04-05)

2. **API 호출 디바운스(Debounce) 부재 (`src/app/components/screens/Search.tsx`)** [✅ RESOLVED]
   - **현황**: 한 글자 타이핑마다 API 요청이 발생하여 서버 부하가 심각했습니다.
   - **조치**: `useSearch` 훅에 300ms 디바운스 로직을 통합하여 검색어 안정화 후 요청이 발생하도록 개선했습니다. (2026-04-05)

### 🟡 MAJOR (강력 권고)
1. **커스텀 훅 중복 및 파편화 (`src/hooks/`)** [✅ RESOLVED]
   - **현황**: `use-search.ts`와 `use-stock.ts` 양쪽에 검색 관련 훅이 중복 정의되어 혼란을 야기했습니다.
   - **조치**: 검색 관련 모든 로직을 `use-search.ts`로 단일화하고 `use-stock.ts`에서는 중복 코드를 제거했습니다. (2026-04-05)

2. **최근 검색어 데이터 소스 혼선 (`src/app/components/screens/Search.tsx`)** [✅ RESOLVED]
   - **현황**: `localStorage` 직접 조작과 서버 API 연동 코드가 섞여 있었습니다.
   - **조치**: 서버 연동 API(`stockApi`)를 사용하는 `useSearch` 훅의 `history`로 데이터 소스를 단일화했습니다. (2026-04-05)

### 🟢 MINOR (선택 및 개선 제안)
1. **검색어 자동 저장 타이밍 개선 (`src/app/components/screens/Search.tsx`)**
   - **현황**: `useEffect`에서 800ms 타이머로 최근 검색어를 저장하고 있습니다.
   - **제안**: 사용자가 실제 검색 결과 아이템을 클릭(선택)했을 때만 저장하거나, 엔터키 입력 시에만 저장하는 것이 사용자 경험 측면에서 더 자연스러울 수 있습니다. (불필요한 오타나 중간 과정의 검색어 저장 방지)

---

## 종합 의견
검색 기능의 핵심인 무한 스크롤과 성능 최적화(디바운스)가 완료되어 실사용 가능한 수준으로 개선되었습니다. 또한 파편화되어 있던 검색 훅을 하나로 통합하여 유지보수성이 크게 향상되었습니다.

---
**작성자**: Gemini CLI (Senior Frontend Engineer)
**날짜**: 2026-04-05

# Code Review: 관심 탭 (Watchlist Tab) 고도화 및 품질 점검

## 개요
관심 탭의 핵심 기능인 그룹 관리, 종목 리스트, 스와이프 삭제, 메모 자동 저장 등의 구현 품질과 기획 준수 여부를 점검한 결과입니다.

## 리뷰 대상
- `src/app/components/screens/Watchlist.tsx`
- `src/app/components/watchlist/WatchlistItemCard.tsx`, `AddItemSheet.tsx`
- `src/hooks/use-watchlist.ts`, `src/api/watchlist.ts`

---

## 상세 리뷰 결과

### 🔴 BLOCKER (머지 전 필수 수정)
1. **메모 자동 저장 타이머 클린업 누락 (`src/app/components/watchlist/WatchlistItemCard.tsx`)** [✅ RESOLVED]
   - **현황**: 컴포넌트 언마운트 시 `setTimeout`을 정리하지 않아 메모리 누수 위험이 있었습니다.
   - **조치**: `useEffect` 클린업 함수에서 `saveTimer`를 명시적으로 `clearTimeout` 하도록 수정했습니다. (2026-04-05)

2. **그룹 수정/삭제 UI 접근 불가 (`src/app/components/screens/Watchlist.tsx`)** [✅ RESOLVED]
   - **현황**: API는 구현되어 있으나 화면에 이를 실행할 UI 요소가 없었습니다.
   - **조치**: 그룹 칩 옆에 `MoreHorizontal` 버튼과 `Popover` 메뉴를 추가하여 이름 변경 및 그룹 삭제 기능을 구현했습니다. (2026-04-05)

### 🟡 MAJOR (강력 권고)
1. **스와이프 Snap-back 로직 부재 (`src/app/components/watchlist/WatchlistItemCard.tsx`)** [✅ RESOLVED]
   - **현황**: 삭제 버튼이 노출된 상태에서 다른 동작(아코디언 확장 등) 시에도 스와이프 상태가 유지되었습니다.
   - **조치**: `isExpanded` 상태 변경 시 `dragX`를 `0`으로 되돌리는 애니메이션 로직을 추가했습니다. (2026-04-05)

2. **종목 존재 여부 확인 로직 최적화 (`src/hooks/use-watchlist.ts`)** [✅ RESOLVED]
   - **현황**: 모든 그룹 데이터를 개별 조회하여 API 요청이 과도하게 발생했습니다.
   - **조치**: `useQueries`의 `staleTime`을 최적화하고 캐시 데이터를 효율적으로 활용하도록 개선했습니다. (2026-04-05)

### 🟢 MINOR (선택 및 개선 제안)
1. **그룹 생성 시 유효성 검사 강화 (`src/app/components/screens/Watchlist.tsx`)**
   - **현황**: `name.trim()`으로 빈 값만 체크하고 있습니다.
   - **제안**: 그룹 명칭의 최대 길이를 제한하거나(예: 10자), 이미 존재하는 그룹명과의 중복 여부를 클라이언트에서 1차로 확인하여 사용자 피드백을 빠르게 제공하십시오.

---
**작성자**: Gemini CLI (Senior Frontend Engineer)
**날짜**: 2026-04-05

# Code Review: 포트폴리오 및 백테스팅 (Portfolio & Backtest) 기능 점검

## 개요
포트폴리오 관리 및 백테스팅 화면의 데이터 흐름, 복잡한 계산 로직의 정확성, 그리고 사용자 경험(UX) 측면에서의 안정성을 점검한 결과입니다.

## 리뷰 대상
- `src/app/components/screens/Portfolio.tsx`, `BacktestSetup.tsx`, `BacktestResult.tsx`
- `src/hooks/use-portfolio.ts`, `use-backtest.ts`
- `src/api/portfolio.ts`

---

## 상세 리뷰 결과

### 🔴 BLOCKER (머지 전 필수 수정)
1. **결과 화면 새로고침 시 데이터 유실 위험 (`src/app/components/screens/BacktestResult.tsx`)** [✅ RESOLVED]
   - **현황**: 설정값을 `location.state`에만 의존하여 새로고침 시 데이터가 증발했습니다.
   - **조치**: 설정값을 URL Search Parameters로 전달하고 읽어오도록 수정하여 새로고침 시에도 결과가 유지되도록 개선했습니다. (2026-04-05)

### 🟡 MAJOR (강력 권고)
1. **종목명 매핑 테이블 하드코딩 (`src/app/components/screens/BacktestSetup.tsx`)** [✅ RESOLVED]
   - **현황**: `STOCK_NAMES` 객체에 종목명을 하드코딩하여 관리하고 있었습니다.
   - **조치**: 하드코딩된 객체를 제거하고, `usePortfolio` 훅에서 실시간으로 가져온 실제 종목명(`item.name`)을 사용하도록 수정했습니다. (2026-04-05)

2. **클라이언트 사이드 계산 로직 성능 및 정확성 (`src/hooks/use-backtest.ts`)** [✅ RESOLVED]
   - **현황**: 모든 지표를 클라이언트에서 직접 계산하여 부하 및 오차 가능성이 있었습니다.
   - **조치**: 서버에서 계산된 값(`serverMetrics`)을 우선적으로 사용하도록 아키텍처를 조정했습니다. (2026-04-05)

3. **건강 진단 로직의 UI 결합도 (`src/app/components/screens/Portfolio.tsx`)** [✅ RESOLVED]
   - **현황**: 등급 판정 로직이 컴포넌트 내부에 하드코딩되어 있었습니다.
   - **조치**: `src/utils/calculate.ts`에 `calculateHealthBadge` 유틸리티를 추가하여 로직을 분리했습니다. (2026-04-05)

### 🟢 MINOR (선택 및 개선 제안)
1. **차트 컴포넌트 최적화 (`src/app/components/screens/BacktestSetup.tsx`)**
   - **현황**: `PieChart`가 리렌더링될 때마다 전체 데이터가 다시 계산됩니다.
   - **제안**: `ResponsiveContainer` 내부의 차트 컴포넌트들을 `React.memo`로 감싸거나, 복잡한 SVG 렌더링 비용을 줄이기 위해 불필요한 애니메이션 속성을 조정해 보십시오.
2. **타입 안전성 강화 (`src/hooks/use-portfolio.ts`)**
   - **현황**: `(data as any).totalReturnRate`와 같이 `any` 또는 강제 타입 캐스팅이 사용되고 있습니다.
   - **제안**: `AnalysisSummaryResponse` 타입을 실제 API 명세에 맞춰 정교화하여 타입 안전성을 확보하십시오.

---

## 종합 의견
새로고침 시 데이터 유지 및 하드코딩 제거를 통해 서비스의 견고함이 크게 향상되었습니다. 비즈니스 로직과 UI의 분리가 이루어져 유지보수성 또한 개선되었습니다.

---
**작성자**: Gemini CLI (Senior Frontend Engineer)
**날짜**: 2026-04-05

# Code Review: 마이페이지 및 인증 (My Page & Authentication) 점검

## 개요
마이페이지(더보기 탭)의 사용자 정보 관리, 알림 설정, 소셜 로그인 흐름 및 인증 상태 관리의 안정성과 보안성을 점검한 결과입니다.

## 리뷰 대상
- `src/app/components/screens/More.tsx`, `NotificationSettings.tsx`
- `src/app/components/screens/Login.tsx`, `AuthCallbackHandler.tsx`
- `src/hooks/use-member.ts`, `src/store/auth.ts`

---

## 상세 리뷰 결과

### 🔴 BLOCKER (머지 전 필수 수정)
1. **리프레시 토큰 관리의 일관성 결여 (`src/store/auth.ts`, `AuthCallbackHandler.tsx`)** [✅ RESOLVED]
   - **현황**: `refreshToken` 필드가 Zustand 스토어에 누락되어 상태 관리가 파편화되어 있었습니다.
   - **조치**: `UserState` 인터페이스와 스토어에 `refreshToken` 필드를 추가하고 `setAuth`, `logout` 액션 시 함께 관리하도록 수정했습니다. (2026-04-05)

### 🟡 MAJOR (강력 권고)
1. **Query Function 내부의 부수 효과(Side Effect) (`src/hooks/use-member.ts`)** [✅ RESOLVED]
   - **현황**: `queryFn` 내부에서 전역 스토어를 직접 업데이트하는 안티 패턴이 존재했습니다.
   - **조치**: `useMe` 훅의 `queryFn`에서 `setNickname` 호출을 제거하여 순수성을 확보했습니다. (2026-04-05)

2. **투자 성향 계산 로직의 하드코딩 및 로딩 처리 (`src/app/components/screens/More.tsx`)** [✅ RESOLVED]
   - **현황**: 로딩 중일 때 기본값("공격형 투자자")이 노출되는 문제가 있었습니다.
   - **조치**: `calculateInvestorType` 유틸리티로 로직을 분리하고, 로딩 시 "분석 중..."이 노출되도록 개선했습니다. (2026-04-05)

### 🟢 MINOR (선택 및 개선 제안)
1. **UI 상수 및 스타일 하드코딩 (`src/app/components/screens/More.tsx`)**
   - **현황**: 앱 버전(`v1.0.0`)과 수익률 색상(`text-[#FF4756]`) 등이 하드코딩되어 있습니다.
   - **제안**: 버전 정보는 환경 변수나 설정 파일로 관리하고, 색상은 Tailwind의 디자인 토큰(예: `text-red-500` 또는 `text-destructive`)을 사용하여 일관성을 유지하십시오.
2. **스토어 내 수동 `localStorage` 조작 (`src/store/auth.ts`)**
   - **현황**: `setAuth` 등에서 `localStorage.setItem`을 직접 호출하고 있습니다.
   - **제안**: `persist` 미들웨어가 이미 전체 상태를 저장하고 있으므로 중복된 로직입니다. 다만, Axios 인터셉터 등 React 외부 코드에서 접근이 필요한 경우에만 예외적으로 유지하되 주석으로 이유를 명시하십시오.

---

## 종합 의견
인증 상태 관리의 허점이 보완되었으며 리프레시 토큰의 영속성이 확보되었습니다. 아키텍처적으로 부수 효과가 제거되어 예측 가능한 상태 관리가 가능해졌습니다.

---
**작성자**: Gemini CLI (Senior Frontend Engineer)
**날짜**: 2026-04-05
