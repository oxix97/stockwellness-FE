# API 명세 레퍼런스

> **이 파일의 역할**: TypeScript 타입 정의 + 구현 상태 레퍼런스 (프론트엔드 전용)
> **화면별 API 매핑** (어떤 화면에서 어떤 API를 호출하는지) → `@docs/specs/screen-api-mapping/{화면명}.md` (루트 docs)
>
> 백엔드 소스: `stockwellness-api` Controllers + `stockwellness-core` UseCase/Result + `openapi3.yaml` (Spring REST Docs 자동 생성)
> 베이스 URL: `VITE_API_BASE_URL` (개발: `http://localhost:8080`)
> 모든 응답은 공통 envelope 구조. Axios 인터셉터가 `data.data`를 자동 언래핑함.
>
> 구현 상태: **✅ 완료** (Controller + openapi3.yaml 확인) / **🚧 미구현** (Controller 없음)

---

## 공통 응답 구조

```ts
// 모든 API 응답의 공통 envelope
interface ApiEnvelope<T> {
  success: boolean;       // 성공 여부
  status: number;         // HTTP 상태 코드
  code: string;           // 비즈니스 코드 (S000: 성공, S001: 생성)
  message: string;        // 결과 메시지
  data: T;                // 실제 데이터 (인터셉터가 이 값만 추출)
  timestamp: string;      // 응답 시간 (ISO 8601)
  traceId: string | null;
  errors: unknown[];      // 필드 에러 목록 (성공 시 빈 배열)
}
```

---

## 인증 (Auth)

### 로그인 ✅ 완료
`POST /api/v1/auth/login`

```ts
// 요청
interface LoginRequest {
  email: string;
  nickname: string;
  loginType: 'GOOGLE' | 'KAKAO' | 'NAVER';
}

// 응답 data
interface LoginData {
  accessToken: string;
  refreshToken: string;
  memberId: number;
  email: string;
  nickname: string;
  joinedDate: string; // 'YYYY-MM-DD'
}
```

### 로그아웃 ✅ 완료
`POST /api/v1/auth/logout`
- 헤더: `Authorization: Bearer {accessToken}`
- 응답 data: `null`

### 토큰 재발급 ✅ 완료
`POST /api/v1/auth/reissue`

```ts
// 요청
interface ReissueRequest {
  refreshToken: string;
}

// 응답 data
interface ReissueData {
  accessToken: string;
  refreshToken: string;
}
```

---

## 포트폴리오 (Portfolio)

### 공통 타입

```ts
// 포트폴리오 구성 종목 — 목록/상세 응답의 items 배열 원소
interface PortfolioItem {
  symbol: string;         // 종목 심볼 (예: 'AAPL', '005930', 'CASH')
  quantity: number;       // 보유 수량
  purchasePrice: number;  // 평균 매수가
  currency: 'KRW' | 'USD';
  assetType: 'STOCK' | 'CASH' | 'ETF';
  targetWeight: number;   // 목표 비중 (%)
}

// 목록·상세 공통 응답 구조
interface PortfolioSummary {
  id: number;
  name: string;
  description: string;
  totalPurchaseAmount: number;
  items: PortfolioItem[];
}
```

### 목록 조회 ✅ 완료
`GET /api/v1/portfolios`
- 인증 필요
- 응답 data: `PortfolioSummary[]`

### 생성 ✅ 완료
`POST /api/v1/portfolios`
- 인증 필요
- 응답 상태: `201 Created`

```ts
// 요청
interface CreatePortfolioRequest {
  name: string;
  description: string;
  items: PortfolioItemInput[];
}

interface PortfolioItemInput {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currency: 'KRW' | 'USD';
  assetType: 'STOCK' | 'CASH' | 'ETF';
  targetWeight: number; // 목표 비중 (%)
}

// 응답 data: number (생성된 portfolioId)
```

### 상세 조회 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}`
- 인증 필요
- 응답 data: `PortfolioSummary`

### 수정 ✅ 완료
`PUT /api/v1/portfolios/{portfolioId}`
- 인증 필요
- 요청: `CreatePortfolioRequest`와 동일 구조
- 응답 data: `null`

### 삭제 ✅ 완료
`DELETE /api/v1/portfolios/{portfolioId}`
- 인증 필요
- 응답 data: `null`

### 건강 진단 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/health`
- 인증 필요

```ts
// 응답 data
interface PortfolioHealthData {
  overallScore: number;
  categories: {
    agility: number;
    stability: number;
    diversification: number;
    cash: number;
    return: number;
  };
  stockContributions: unknown[];
  summary: string;
  insight: string;
  nextSteps: string[];
}
```

### 최신 AI 리밸런싱 조언 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/advice/latest`
- 인증 필요

```ts
// 응답 data
interface PortfolioAdviceData {
  content: string;
  action: 'REBALANCE' | 'RISK_MANAGEMENT' | 'TECHNICAL_OPTIMIZATION' | 'DIVERSIFICATION';
  createdAt: string; // ISO 8601
}
```

---

## 포트폴리오 분석 (Portfolio Analysis)

### 자산 가치 분석 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/analysis/valuation`
- 인증 필요

```ts
// 응답 data
interface ValuationData {
  totalPurchaseAmount: number;
  currentTotalValue: number;
  totalProfitLoss: number;
  totalReturnRate: number;
  dailyProfitLoss: number;
  dailyReturnRate: number;
  mdd: number;
  sharpeRatio: number;
  beta: number;
}
```

### 자산 분산도 분석 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/analysis/diversification`
- 인증 필요

```ts
// 응답 data
interface DiversificationData {
  totalValue: number;
  assetRatios: { name: string; value: number }[];
  sectorRatios: { name: string; value: number }[];
  countryRatios: { name: string; value: number }[];
}
```

### 리밸런싱 분석 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/analysis/rebalancing`
- 인증 필요

```ts
// 응답 data
interface RebalancingData {
  totalValue: number;
  items: {
    symbol: string;
    currentWeight: number;
    targetWeight: number;
    diffWeight: number;
    currentQuantity: number;
    recommendedQuantity: number;
    currentPrice: number;
    expectedTradeAmount: number;
  }[];
}
```

### 분석 요약 (종합) ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/analysis/summary`
- 인증 필요
- valuation + diversification + rebalancing을 한 번에 반환하는 집계 엔드포인트

```ts
// 응답 data
interface AnalysisSummaryData {
  valuation: ValuationData;
  diversification: DiversificationData;
  rebalancing: RebalancingData;
}
```

### 백테스팅 실행 ✅ 완료
`POST /api/v1/portfolios/{portfolioId}/analysis/backtest`
- 인증 필요

```ts
// 요청
interface BacktestRequest {
  strategy: 'LUMP_SUM' | 'DCA';
  amount: number;
  benchmarkTicker: string; // 예: '^KS11'
  rebalancingPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  weights: Record<string, number>; // { '005930': 100 }
}

// 응답 data
interface BacktestData {
  dailyResults: {
    date: string;
    totalValue: number;
    totalInvested: number;
    returnRate: number;
    benchmarkReturnRates: Record<string, number>;
  }[];
  cagr: number;
  mdd: number;
  sharpeRatio: number;
  totalReturnRate: number;
  volatility: number;
  alpha: number;
  beta: number;
  bestYearRate: number;
  worstYearRate: number;
  comparisons: {
    indexName: string;
    ticker: string;
    totalReturn: number;
    alpha: number;
    beta: number;
  }[];
  aiComment: string;
}
```

### 종목 간 상관관계 분석 ✅ 완료
`GET /api/v1/portfolios/{portfolioId}/analysis/correlation`
- 인증 필요

```ts
// 응답 data: Record<string, Record<string, number>>
// 예: { 'AAPL': { 'AAPL': 1, 'TSLA': 0.85 }, 'TSLA': { ... } }
type CorrelationMatrix = Record<string, Record<string, number>>;
```

---

## 종목 탐색 (Stock Discovery)

### 종목 통합 검색 ✅ 완료
`GET /api/v1/stocks/search`
- 인증 선택 (로그인 시 검색 히스토리 자동 저장)

```ts
// 쿼리 파라미터
interface StockSearchParams {
  keyword: string;            // 필수 — 티커 또는 종목명
  marketType?: 'KOSPI' | 'KOSDAQ';
  status?: 'ACTIVE' | 'HALTED';
  page?: number;              // 0부터 시작, 기본값 0
  size?: number;              // 기본값 10
}

// 응답 data (Spring Slice 구조)
interface StockSearchData {
  content: StockItem[];
  number: number;             // 현재 페이지
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// 종목 기본 정보 — 검색/신규상장에 공통으로 사용
interface StockItem {
  ticker: string;
  name: string;
  marketType: 'KOSPI' | 'KOSDAQ' | null;
  sectorName: string | null;
  status: 'ACTIVE' | 'HALTED';
}
```

### 종목 상세 정보 ✅ 완료
`GET /api/v1/stocks/{ticker}`

```ts
// 응답 data
interface StockDetailData {
  isinCode: string;           // ISIN 코드 (예: 'KR7005930003')
  ticker: string;
  name: string;
  marketType: string;
  totalShares: number;
  baseDate: string;           // 'YYYY-MM-DD'
  closePrice: number;
  priceChange: number;
  fluctuationRate: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  tradingValue: number;
  marketCap: number;
  rsi14: number;
  ma20: number;
  aiInsight: string;
}
```

### 신규 상장 종목 조회 ✅ 완료
`GET /api/v1/stocks/new-listings`
- 인증 불필요
- `groupCode = 'ST'` (주식)만 반환. ETF·ETN·ELW 제외. 해외 종목(`groupCode = null`)도 자연 제외.
- 응답 data: `StockItem[]`

> **주의:** 화면 명세(`home.md`)에 🚧 미구현으로 표시되어 있으나 **백엔드 구현 완료**.
> `StockController.getNewListings()` 확인 + `openapi3.yaml` 등재 완료.

### 인기 검색어 조회 ✅ 완료
`GET /api/v1/stocks/popular-search`
- 인증 불필요
- 응답 data: `string[]` — Top 10 종목명/티커 리스트

### 최근 검색어 조회 ✅ 완료
`GET /api/v1/stocks/search/history`
- 인증 선택 (비로그인 시 빈 배열 반환)
- 응답 data: `string[]`

### 최근 검색어 개별 삭제 ✅ 완료
`DELETE /api/v1/stocks/search/history?keyword={keyword}`
- 인증 선택
- 응답 data: `null`

### 최근 검색어 전체 삭제 ✅ 완료
`DELETE /api/v1/stocks/search/history/all`
- 인증 선택
- 응답 data: `null`

---

## 종목 시세 (Stock Price)

### 차트용 시세 데이터 조회 ✅ 완료
`GET /api/v1/stocks/{ticker}/prices/history`

```ts
// 쿼리 파라미터
interface PriceHistoryParams {
  period?: '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'; // 기본값: '1Y'
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';          // 기본값: 'DAILY'
  includeBenchmark?: boolean;                           // 기본값: false
}

// 응답 data
interface PriceHistoryData {
  ticker: string;
  stockName: string;
  benchmarkName: string;
  prices: {
    date: string;             // 'YYYY-MM-DD'
    open: number;
    high: number;
    low: number;
    close: number;
    adjClose: number;
    volume: number;
    transactionAmt: number;
    ma5: number | null;
    ma20: number | null;
    ma60: number | null;
    ma120: number | null;
  }[];
  benchmarks: {
    date: string;
    returnRate: number;
  }[];
}
```

### 종목 수익률 조회 ✅ 완료
`GET /api/v1/stocks/{ticker}/returns`

```ts
// 쿼리 파라미터
interface StockReturnsParams {
  period: '1W' | '1M' | '3M' | '6M' | '1Y'; // 필수, 기본값: '1Y'
}

// 응답 data
interface StockReturnsData {
  ticker: string;
  period: string;
  stockReturnRate: number;
  benchmarkReturnRate: number;
}
```

---

## 섹터 (Sector)

### 섹터 등락률 랭킹 ✅ 완료
`GET /api/v1/sectors/ranking/fluctuation`

```ts
// 쿼리 파라미터
interface SectorRankingParams {
  date?: string;               // 'YYYY-MM-DD', 기본값: 최신 영업일
  marketType?: 'KOSPI' | 'KOSDAQ';
  limit?: number;              // 기본값: 10
}

// 응답 data (배열)
interface SectorRankingItem {
  sectorCode: string;
  sectorName: string;
  currentPrice: number;
  fluctuationRate: number;
  isOverheated: boolean;
  aiComment: string | null;   // AI 한 줄 의견 (null일 수 있음)
}
```

> **주의:** 화면 명세(`home.md`)의 Response에 `aiComment` 필드가 누락되어 있음. 실제 응답에는 포함됨.

### 섹터 수급 랭킹 ✅ 완료
`GET /api/v1/sectors/ranking/supply`

```ts
// 쿼리 파라미터: SectorRankingParams와 동일

// 응답 data (배열)
interface SectorSupplyItem {
  sectorCode: string;
  sectorName: string;
  netForeignBuyAmount: number; // 외국인 순매수 금액 (원)
  netInstBuyAmount: number;    // 기관 순매수 금액 (원)
  foreignConsecutiveBuyDays: number;
  instConsecutiveBuyDays: number;
}
```

### 섹터 상세 정보 ✅ 완료
`GET /api/v1/sectors/{sectorCode}/detail`

```ts
// 쿼리 파라미터
interface SectorDetailParams {
  date?: string; // 'YYYY-MM-DD', 기본값: 최신 영업일
}

// 응답 data
interface SectorDetailData {
  sectorCode: string;
  sectorName: string;
  baseDate: string;            // 'YYYY-MM-DD'
  currentPrice: number;
  fluctuationRate: number;
  isOverheated: boolean;
  diagnosisMessage: string;
  technicalIndicators: {
    ma5: number | null;
    ma20: number | null;
    ma60: number | null;
    ma120: number | null;
    rsi14: number | null;
    macd: number | null;
    macdSignal: number | null;
    bollingerUpper: number | null;
    bollingerMid: number | null;
    bollingerLower: number | null;
    adx: number | null;
    plusDi: number | null;
    minusDi: number | null;
    alignmentStatus: string | null;
    isGoldenCross: boolean | null;
    isDeadCross: boolean | null;
    isMacdCross: boolean | null;
    aiInsight: string | null;
  };
  leadingStocks: {
    name: string;
    ticker: string;
    fluctuationRate: number;
    tradeVolume: number;
    transactionAmt: number;
  }[];
  aiOpinion: {
    decision: string | null;
    confidenceScore: number;
    title: string | null;
    keyReasons: string[];
    detailedAnalysis: string | null;
  };
}
```

### 섹터 vs 시장 비교 분석 ✅ 완료
`GET /api/v1/sectors/{sectorCode}/comparison`

```ts
// 쿼리 파라미터
interface SectorComparisonParams {
  date?: string; // 'YYYY-MM-DD', 기본값: 최신 영업일
}

// 응답 data: SectorComparisonResult (상세 타입은 백엔드 SectorComparisonResult.java 참조)
```

---

## 시장 지수 (Market)

### 시장 지수 목록 조회 ✅ 완료
`GET /api/v1/market/indexes`
- 인증 불필요
- KOSPI · KOSDAQ · S&P500 등 주요 지수 반환

```ts
// 응답 data (배열)
interface MarketIndexItem {
  name: string;              // 예: 'KOSPI', 'KOSDAQ', 'S&P500'
  currentPrice: number;
  fluctuationRate: number;
  history: {
    date: string;            // 'YYYY-MM-DD'
    close: number;
  }[];
}
```

---

## 관심 목록 (Watchlist)

모든 Watchlist 엔드포인트는 `Authorization: Bearer {accessToken}` 헤더 필수.

### 관심 그룹 목록 조회 ✅ 완료
`GET /api/v1/watchlist/groups`

```ts
// 응답 data (배열)
interface WatchlistGroup {
  id: number;
  name: string;
  itemCount: number;
}
```

### 관심 그룹 생성 ✅ 완료
`POST /api/v1/watchlist/groups`
- 응답 상태: `201 Created`

```ts
// 요청
interface CreateWatchlistGroupRequest {
  name: string;
}
// 응답 data: number (생성된 groupId)
```

### 관심 그룹 이름 수정 ✅ 완료
`PATCH /api/v1/watchlist/groups/{groupId}`

```ts
// 요청
interface UpdateWatchlistGroupRequest {
  name: string;
}
// 응답 data: null
```

### 관심 그룹 삭제 ✅ 완료
`DELETE /api/v1/watchlist/groups/{groupId}`
- 응답 data: `null`

### 관심 종목 목록 조회 ✅ 완료
`GET /api/v1/watchlist/groups/{groupId}/items`

```ts
// 응답 data
interface WatchlistItemsData {
  groupName: string;
  items: {
    ticker: string;
    name: string;
    currentPrice: number | null;
    fluctuationRate: number | null;
    note: string;
    rsi: number | null;
    rsiStatus: string;         // 'RSI 과매수' | 'RSI 과매도' | '데이터 없음' 등
    aiInsight: string;
  }[];
}
```

### 관심 종목 추가 ✅ 완료
`POST /api/v1/watchlist/groups/{groupId}/items`
- 응답 상태: `201 Created`

```ts
// 요청
interface AddWatchlistItemRequest {
  ticker: string;
  note: string;
}
// 응답 data: null
```

### 관심 종목 제거 ✅ 완료
`DELETE /api/v1/watchlist/groups/{groupId}/items/{ticker}`
- 응답 data: `null`

### 관심 종목 메모 수정 ✅ 완료
`PATCH /api/v1/watchlist/groups/{groupId}/items/{ticker}/note`

```ts
// 요청
interface UpdateWatchlistNoteRequest {
  note: string;
}
// 응답 data: null
```

---

## 회원 (Member)

모든 Member 엔드포인트는 `Authorization: Bearer {accessToken}` 헤더 필수.

### 내 정보 조회 ✅ 완료
`GET /api/v1/members/me`

```ts
// 응답 data
interface MemberData {
  id: number;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
  riskLevel: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;          // ISO 8601
  modifiedAt: string;         // ISO 8601
  portfolioSummary: {
    totalAssetAmount: number;
    totalReturnRate: number;
  };
}
```

### 내 정보 수정 ✅ 완료
`PUT /api/v1/members/me`

```ts
// 요청
interface UpdateMemberRequest {
  nickname: string;
  riskLevel?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}
// 응답 data: null
```

### 회원 탈퇴 ✅ 완료
`DELETE /api/v1/members/me`
- 응답 data: `null`

### 알림 설정 조회 ✅ 완료
`GET /api/v1/members/me/notifications`

```ts
// 응답 data
interface NotificationSettingsData {
  rebalancing: boolean;       // 리밸런싱 알림
  marketAlert: boolean;       // 시장 경보 알림
  newListing: boolean;        // 신규 상장 알림
}
```

### 알림 설정 변경 ✅ 완료
`PUT /api/v1/members/me/notifications`

```ts
// 요청: NotificationSettingsData와 동일 구조
// 응답 data: null
```

---

## API 모듈 매핑

| API 태그 | 파일 |
|---|---|
| Auth | `src/api/auth.ts` |
| Portfolio + Portfolio Analysis | `src/api/portfolio.ts` |
| Stock Discovery + Stock Price | `src/api/stock.ts` |
| Sector | `src/api/sector.ts` |
| Market | `src/api/market.ts` (Market 섹션 참고) |
| Watchlist | `src/api/watchlist.ts` |
| Member | `src/api/member.ts` |

---

## 구현 상태 요약

| 도메인 | 총 엔드포인트 | ✅ 완료 | 🚧 미구현 |
|-------|-------------|--------|---------|
| Auth | 3 | 3 | 0 |
| Portfolio | 7 | 7 | 0 |
| Portfolio Analysis | 6 | 6 | 0 |
| Stock Discovery | 7 | 7 | 0 |
| Stock Price | 2 | 2 | 0 |
| Sector | 4 | 4 | 0 |
| Market | 1 | 1 | 0 |
| Watchlist | 8 | 8 | 0 |
| Member | 5 | 5 | 0 |
| **합계** | **43** | **43** | **0** |

> **참고:** `GET /api/v1/stocks/new-listings`는 화면 명세(`home.md`)에 🚧 미구현으로 표시되어 있으나,
> `StockController.java` 및 `openapi3.yaml`(Spring REST Docs 자동 생성)에 등재 확인. **백엔드 구현 완료.**
