# Using API — Stockwellness Frontend

> 기준일: 2026-03-20
> 현재 호출 중: **22개** (GET 13 · POST 5 · PUT 3 · DELETE 2 · PATCH 1)
> 추가 필요: **6개** — [8. 필요한 API](#8-필요한-api-미구현) 참고

---

## 공통 사항

| 항목 | 내용 |
|---|---|
| Base URL | `/api` (Vite 프록시 → `VITE_API_BASE_URL`) |
| Content-Type | `application/json` |
| 인증 | `Authorization: Bearer {accessToken}` (localStorage 주입) |
| 응답 언래핑 | 인터셉터에서 `response.data.data` 자동 추출 |
| 401 처리 | 자동 토큰 갱신 (`POST /v1/auth/reissue`) → 실패 시 `/login` 리다이렉트 |
| 성공 응답 형식 | `{ "data": {...}, "timestamp": "..." }` |
| 에러 응답 형식 | `{ "status", "code", "message", "traceId" }` |

---

## 1. 인증 API

> 파일: `src/api/auth.ts`

### POST `/v1/auth/login`
소셜 OAuth2 로그인

**Request**
```ts
{ code: string; state?: string; provider: "GOOGLE" | "KAKAO" | "NAVER" }
```
**Response**
```ts
{ memberId: number; email: string; nickname: string; accessToken: string; refreshToken: string; joinedDate: string }
```
**사용처:** `AuthCallback.tsx` (직접 호출)

---

### POST `/v1/auth/logout`
로그아웃 (서버 측 세션 무효화)

**Response:** void
**사용처:** 직접 호출

---

### POST `/v1/auth/reissue`
액세스 토큰 갱신

**Request**
```ts
{ refreshToken: string }
```
**Response**
```ts
{ accessToken: string; refreshToken: string }
```
**사용처:** `src/api/client.ts` 응답 인터셉터 (401 자동 재시도)

---

## 2. 포트폴리오 API

> 파일: `src/api/portfolio.ts` / 훅: `src/hooks/use-portfolio.ts`, `src/hooks/use-backtest.ts`

### GET `/v1/portfolios`
내 포트폴리오 목록 조회

**Response:** `PortfolioResponse[]`
**QueryKey:** (직접 사용)

---

### POST `/v1/portfolios`
포트폴리오 생성

**Request**
```ts
{
  name: string;
  description: string;
  items: {
    symbol: string;
    quantity: number;
    purchasePrice: number;
    currency: string;
    assetType: "STOCK" | "CASH";
    targetWeight: number;
  }[];
}
```
**Response:** `number` (포트폴리오 ID)
**사용처:** `PortfolioWizard.tsx` — 3단계 완료 시 호출

---

### GET `/v1/portfolios/{portfolioId}`
포트폴리오 보유 종목 상세

**Response**
```ts
{
  id: number; name: string; description: string;
  totalPurchaseAmount: number;
  items: PortfolioItemResponse[];
}
```
**QueryKey:** `["portfolio", portfolioId, "detail"]`
**훅:** `usePortfolio().holdings`

---

### GET `/v1/portfolios/{portfolioId}/analysis/valuation`
포트폴리오 평가금액 및 수익률

**Response**
```ts
{
  totalPurchaseAmount: number; currentTotalValue: number;
  totalProfitLoss: number; totalReturnRate: number;
  dailyProfitLoss: number; dailyReturnRate: number;
  mdd: number; sharpeRatio: number; beta: number;
}
```
**QueryKey:** `["portfolio", portfolioId, "valuation"]`
**훅:** `usePortfolio().valuation`

---

### GET `/v1/portfolios/{portfolioId}/analysis/diversification`
자산 배분 분석 (섹터·국가·자산군 비중)

**Response**
```ts
{
  totalValue: number;
  assetRatios: AssetRatio[];
  sectorRatios: SectorRatio[];
  countryRatios: CountryRatio[];
}
```
**QueryKey:** `["portfolio", portfolioId, "diversification"]`
**훅:** `usePortfolio().diversification`

---

### GET `/v1/portfolios/{portfolioId}/analysis/rebalancing`
리밸런싱 추천 (목표 비중 대비 편차)

**Response**
```ts
{ totalValue: number; items: RebalancingItem[] }
```
**QueryKey:** (직접 사용)

---

### GET `/v1/portfolios/{portfolioId}/advice/latest`
AI 리밸런싱 어드바이스 최신 조회

**Response:** 비정형 데이터 (서버 포맷 확인 필요)
**QueryKey:** `["portfolio", portfolioId, "advice"]`
**훅:** `usePortfolio().advice`

---

### POST `/v1/portfolios/{portfolioId}/analysis/backtest`
백테스트 실행

**Request**
```ts
{ strategy: "DCA" | "LUMP_SUM"; amount: number; benchmarkTicker: string }
```
**Response**
```ts
{
  dailyResults: {
    date: string; totalValue: number; totalInvested: number;
    returnRate: number; benchmarkReturnRate: number;
  }[]
}
```
**훅:** `useBacktest()` (mutation)

---

### GET `/v1/portfolios/{portfolioId}/analysis/correlation`
종목 간 상관관계 매트릭스

**Response:** `Record<string, Record<string, number>>`
**QueryKey:** `["portfolio", portfolioId, "correlation"]`
**훅:** `usePortfolio().correlation`

---

## 3. 주식 API

> 파일: `src/api/stock.ts` / 훅: `src/hooks/use-stock.ts`, `src/hooks/use-search.ts`

### GET `/v1/stocks/popular-search`
인기 검색어 목록

**Response:** `string[]`
**QueryKey:** `["stocks", "popular"]` / `["search", "popular"]`
**훅:** `useStock().popular`, `useSearch().popular`

---

### GET `/v1/stocks/search`
종목 검색 (페이지네이션)

**Query Parameters**
```
keyword: string
page: number (default 0)
size: number (default 20)
```
**Response**
```ts
{
  content: StockSearchResult[];
  number: number; size: number; numberOfElements: number;
  last: boolean; first: boolean; hasNext: boolean; empty: boolean;
}
```
**QueryKey:** `["search", "autocomplete", debouncedKeyword]`
**훅:** `useSearch().autocomplete`, `useStock().search()` (무한 스크롤)

---

### GET `/v1/stocks/new-listings`
신규 상장 종목 목록

**Response:** `NewListingStock[]`
**QueryKey:** `["stocks", "new-listings"]`
**훅:** `useStock().newListings`
**사용처:** `Home.tsx` — 신규 상장 섹션

---

### GET `/v1/stocks/search/history`
검색 기록 조회

**Response:** `string[]`
**QueryKey:** `["search", "history"]`
**훅:** `useSearch().history`

---

### DELETE `/v1/stocks/search/history?keyword={keyword}`
검색 기록 단건 삭제

**Query Parameters:** `keyword: string`
**훅:** `useSearch().deleteHistory` (mutation)

---

### DELETE `/v1/stocks/search/history/all`
검색 기록 전체 삭제

**훅:** `useSearch().clearHistory` (mutation)

---

### GET `/v1/stocks/{ticker}/prices/history`
주가 히스토리 (차트용)

**Query Parameters**
```
period: string (default "1Y")
frequency: string (default "DAILY")
includeBenchmark: boolean (항상 true)
```
**Response**
```ts
{
  ticker: string; stockName?: string; benchmarkName?: string;
  prices: PricePoint[];
  benchmarks: BenchmarkPoint[];
}
```
**QueryKey:** `["stocks", ticker, "history", period, frequency]`
**훅:** `useStock().useHistory(ticker, period, frequency)`

---

### GET `/v1/stocks/{ticker}/returns`
기간별 수익률 비교

**Query Parameters:** `period: string (default "1Y")`
**Response**
```ts
{ ticker: string; period: string; stockReturnRate: number; benchmarkReturnRate: number }
```
**QueryKey:** `["stocks", ticker, "returns", period]`
**훅:** `useStock().useReturns(ticker, period)`

---

## 4. 섹터 API

> 파일: `src/api/sector.ts` / 훅: `src/hooks/use-sector.ts`, `src/hooks/use-supply.ts`

### GET `/v1/sectors/ranking/fluctuation`
섹터 등락률 랭킹

**Query Parameters (optional)**
```
date?: string
marketType?: string
limit?: number
```
**Response:** `SectorRankingItem[]`
```ts
{ sectorCode: string; sectorName: string; currentPrice: number; fluctuationRate: number; isOverheated: boolean }
```
**QueryKey:** `["sectors", "ranking", "fluctuation"]` (staleTime: 5min)
**훅:** `useSector().ranking`
**사용처:** `Home.tsx` — 섹터 캐러셀

---

### GET `/v1/sectors/ranking/supply`
섹터 수급 랭킹 (외국인·기관 순매수)

**Query Parameters (optional):** `date?`, `marketType?`, `limit?`
**Response:** `SectorSupplyItem[]`
```ts
{
  sectorCode: string; sectorName: string;
  netForeignBuyAmount: number; netInstBuyAmount: number;
  foreignConsecutiveBuyDays: number; instConsecutiveBuyDays: number;
}
```
**QueryKey:** `["sectors", "ranking", "supply", limit]` (staleTime: 5min)
**훅:** `useSupply()`
**사용처:** `Home.tsx` — 수급 동향 섹션

---

### GET `/v1/sectors/{sectorCode}/detail`
섹터 상세 정보 (기술 지표·진단·대표 종목)

**Query Parameters (optional):** `date?: string (yyyy-MM-dd)`
**Response**
```ts
{
  sectorCode: string; sectorName: string; baseDate: string;
  currentPrice: number; fluctuationRate: number;
  technicalIndicators: TechnicalIndicators;
  isOverheated: boolean; diagnosisMessage: string;
  leadingStocks: LeadingStock[];
}
```
**QueryKey:** `["sectors", "detail", code]` (staleTime: 5min, 병렬 쿼리)
**훅:** `useSector().details` (useQueries)
**사용처:** `SectorBottomSheet.tsx`

---

## 5. 관심종목 API

> 파일: `src/api/watchlist.ts` / 훅: `src/hooks/use-watchlist.ts`

### GET `/v1/watchlist/groups`
관심종목 그룹 목록

**Response:** `WatchlistGroup[]`
```ts
{ id: number; name: string; itemCount: number }
```
**QueryKey:** `["watchlist", "groups"]`

---

### POST `/v1/watchlist/groups`
관심종목 그룹 생성

**Request:** `{ name: string }`
**Response:** `number` (그룹 ID)
**훅:** `useWatchlist().createGroup` (mutation)

---

### GET `/v1/watchlist/groups/{groupId}/items`
그룹 내 관심종목 목록

**Response:** `WatchlistItemListResponse`
```ts
{ groupName: string; items: WatchlistStock[] }
```
**QueryKey:** `["watchlist", "groups", groupId, "items"]`
**훅:** `useWatchlist().useGroupItems(groupId)`

---

### POST `/v1/watchlist/groups/{groupId}/items`
관심종목 추가

**Request**
```ts
{ ticker: string; note?: string }
```
**훅:** `useWatchlist().addItem` (mutation)

---

### DELETE `/v1/watchlist/groups/{groupId}/items/{ticker}`
관심종목 제거

**훅:** `useWatchlist().removeItem` (mutation)
**사용처:** `WatchlistItemCard.tsx` — 스와이프 삭제

---

### PATCH `/v1/watchlist/groups/{groupId}/items/{ticker}/note`
관심종목 메모 수정

**Request:** `{ note: string }`
**훅:** `useWatchlist().updateItemNote` (mutation)
**사용처:** `WatchlistItemCard.tsx` — 1초 디바운스 자동 저장

---

## 6. 회원 API

> 직접 호출 (API 모듈 미분리) — `src/app/components/screens/More.tsx`, `NotificationSettings.tsx`

### PUT `/v1/members/me`
닉네임 변경

**Request:** `{ nickname: string }`
**사용처:** `More.tsx` — NicknameEditModal
⚠️ 전용 훅/API 모듈 없이 `apiClient.put()` 직접 호출

---

### DELETE `/v1/members/me`
회원 탈퇴

**사용처:** `More.tsx` — 회원 탈퇴 AlertDialog
⚠️ 전용 훅/API 모듈 없이 `apiClient.delete()` 직접 호출

---

### PUT `/v1/members/me/notifications`
알림 설정 저장

**Request:** `{ [notificationId: string]: boolean }` (동적 키)
**사용처:** `NotificationSettings.tsx` — Switch 토글
⚠️ 전용 훅/API 모듈 없이 `apiClient.put()` 직접 호출

---

## 7. 시장 지수 API

> 훅: `src/hooks/use-market-index.ts`

### GET `/v1/market/indexes`
시장 지수 (KOSPI·KOSDAQ·S&P500) 조회

**Response**
```ts
{ name: string; currentPrice: number; fluctuationRate: number; history: { date: string; close: number }[] }[]
```
**QueryKey:** `["market", "indexes"]` (staleTime: 5min)
⚠️ **백엔드 미구현** — 빈 상태 graceful 처리 중
**사용처:** `Home.tsx` — 시장 지수 카드 섹션

---

---

## 8. 필요한 API (미구현)

> 프론트엔드가 요구하지만 백엔드 엔드포인트가 없거나, 현재 하드코딩·누락된 항목.

### 우선순위

| 순위 | 엔드포인트 | 이유 | 프론트 상태 |
|---|---|---|---|
| 🔴 HIGH | `GET /v1/members/me` | 앱 재진입 시 프로필 최신화 불가 | 훅·모듈 없음 |
| 🔴 HIGH | `GET /v1/members/me/notifications` | 알림 설정 화면이 하드코딩 기본값 사용 | 훅·모듈 없음 |
| 🔴 HIGH | `PUT /v1/members/me` | 이미 호출 중이나 API 모듈 미분리 | 컴포넌트 직접 호출 |
| 🔴 HIGH | `PUT /v1/members/me/notifications` | 이미 호출 중이나 API 모듈 미분리 | 컴포넌트 직접 호출 |
| 🔴 HIGH | `DELETE /v1/members/me` | 이미 호출 중이나 API 모듈 미분리 | 컴포넌트 직접 호출 |
| 🟡 MEDIUM | `GET /v1/market/indexes` | 홈 탭 시장 지수 카드 빈 상태 | 훅 있음, 백엔드 미구현 |

---

### GET `/v1/members/me`
현재 로그인한 회원 프로필 조회

**필요 이유**
- 앱 재진입·새로고침 시 Zustand store가 초기화되면 프로필 복구 수단이 없음
- `member` 테이블의 `risk_level`, `status` 필드를 활용하려면 이 엔드포인트가 필요

**Response (제안)**
```ts
{
  memberId: number;
  email: string;
  nickname: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "ACTIVE" | "DEACTIVATED";
  joinedDate: string; // ISO-8601
}
```
**사용 위치:** `More.tsx` 프로필 카드, 앱 초기화 시 토큰 유효성 확인 후 호출
**제안 훅:** `src/hooks/use-member.ts` → `useMe()`

---

### GET `/v1/members/me/notifications`
현재 회원의 알림 설정 조회

**필요 이유**
- `NotificationSettings.tsx`가 현재 하드코딩된 기본값(`enabled: true/false`)으로 초기 렌더링
- 이미 저장된 설정을 서버에서 불러와야 화면이 올바른 상태를 표시할 수 있음

**Response (제안)**
```ts
{
  rebalancing: boolean;
  marketAlert: boolean;
  newListing: boolean;
}
```
**사용 위치:** `NotificationSettings.tsx` 초기 상태 세팅
**제안 훅:** `src/hooks/use-member.ts` → `useNotificationSettings()`

---

### PUT `/v1/members/me`
회원 닉네임 변경 *(이미 호출 중 — API 모듈 분리 필요)*

**현재 상태:** `More.tsx` 내 `NicknameEditModal`에서 `apiClient.put()` 직접 호출
**Request**
```ts
{ nickname: string }
```
**Response (제안)**
```ts
{ nickname: string } // 변경된 닉네임 반환 권장
```
**조치:** `src/api/member.ts` 모듈 생성 후 이관

---

### PUT `/v1/members/me/notifications`
알림 설정 저장 *(이미 호출 중 — API 모듈 분리 필요)*

**현재 상태:** `NotificationSettings.tsx`에서 `apiClient.put()` 직접 호출
**Request (현재 — 동적 키, 개선 필요)**
```ts
{ [id: string]: boolean }  // 예: { rebalancing: true }
```
**Request (제안 — 타입 강화)**
```ts
{
  rebalancing?: boolean;
  marketAlert?: boolean;
  newListing?: boolean;
}
```
**조치:** `src/api/member.ts` 모듈 생성 후 이관, 요청 타입 인터페이스 정의

---

### DELETE `/v1/members/me`
회원 탈퇴 *(이미 호출 중 — API 모듈 분리 필요)*

**현재 상태:** `More.tsx` `handleWithdraw()`에서 `apiClient.delete()` 직접 호출
**Response:** void
**조치:** `src/api/member.ts` 모듈 생성 후 이관

---

### GET `/v1/market/indexes`
시장 지수 조회 (KOSPI · KOSDAQ · S&P500)

**필요 이유**
- `Home.tsx` 상단 시장 지수 카드 섹션이 이 API를 기다리며 빈 상태로 표시 중
- `market_index` 테이블이 DB에 존재하나 API 엔드포인트 미구현

**DB 스키마 (`market_index` 테이블)**
```
index_code VARCHAR(10) — 지수 코드 (예: "KOSPI", "KOSDAQ", "SPX")
index_name VARCHAR(100) — 지수 이름
```

**Response (제안)**
```ts
{
  name: string;            // "KOSPI" | "KOSDAQ" | "S&P500"
  currentPrice: number;
  fluctuationRate: number; // 등락률 %
  history: {
    date: string;          // "yyyy-MM-dd"
    close: number;
  }[];                     // 최근 30일 종가 (미니차트용)
}[]
```
**프론트 훅:** `src/hooks/use-market-index.ts` — QueryKey `["market", "indexes"]`, staleTime 5min
**사용 위치:** `Home.tsx` → `MarketIndexCard.tsx`

---

## 개선 필요 사항

| 항목 | 내용 |
|---|---|
| 회원 API 모듈 분리 | `PUT/DELETE /v1/members/me`, `PUT /v1/members/me/notifications`를 `src/api/member.ts`로 분리 권장 |
| 알림 설정 초기값 | `GET /v1/members/me/notifications` 구현 전까지 NotificationSettings는 하드코딩 기본값 사용 중 |
| 시장 지수 API 구현 | 백엔드 `GET /v1/market/indexes` 구현 후 `use-market-index.ts` 연동 확인 필요 |
| 알림 요청 타입 강화 | `PUT /v1/members/me/notifications` 요청 바디를 동적 키 대신 정의된 인터페이스로 교체 권장 |
