import { components } from "./schema";

/**
 * 백엔드 공통 응답 구조 (Java 21 record 대응)
 */
export interface FieldError {
  field: string;
  value: string;
  reason: string;
}

/** 성공 응답 래퍼 — 백엔드 실제 구조 */
export interface SuccessEnvelope<T> {
  success: boolean;
  status: number;
  code: string;
  message: string;
  data: T;
  timestamp: string;
  traceId?: string | null;
  errors?: FieldError[] | null;
}

/** 에러 응답 래퍼 */
export interface ErrorEnvelope {
  success: false;
  status: number;
  code: string;
  message: string;
  timestamp: string;
  traceId: string | null;
  errors: FieldError[];
}

/**
 * 시장 지수 관련 타입
 */
export interface MarketIndexResult {
  ticker: string;
  name: string;
  currentPrice: number;
  fluctuationRate: number;
  fluctuationAmount: number;
}

export type MarketWeatherLevel =
  | "CLEAR"
  | "SUNNY"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "FOGGY"
  | "RAINY"
  | "STORMY";

export type MarketWeatherReason =
  | "BROAD_RALLY"
  | "STEADY_ADVANCE"
  | "NARROW_ADVANCE"
  | "SIDEWAYS"
  | "HIDDEN_WEAKNESS"
  | "BROAD_SELL_OFF"
  | "VOLATILE_SELL_OFF"
  | "INDEX_ONLY_RALLY"
  | "INDEX_ONLY_ADVANCE"
  | "INDEX_ONLY_MIXED"
  | "INDEX_ONLY_WEAKNESS"
  | "INDEX_ONLY_STORM"
  | "INDEX_ONLY_SIDEWAYS";

export interface MarketWeatherResult {
  weatherLevel: MarketWeatherLevel;
  weatherMessage: string;
  weatherDescription: string;
  reasonCode: MarketWeatherReason;
  asOfDate: string;
}

export interface MarketDashboardResult {
  indexes: MarketIndexResult[];
  weather: MarketWeatherResult;
}

/**
 * 주식 상세 정보 타입 (수동 보강)
 */
export type StockDetailResult = NonNullable<components["schemas"]["api-v1-stocks-ticker10744308"]["data"]>;

/**
 * 포트폴리오 건강 진단 타입 (수동 보강)
 */
export interface StockContribution {
  name: string;
  mainContribution: string;
  score: number;
  reason: string;
}

export type DiagnosisResponse = Omit<NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-health-864754955"]["data"]>, "categories" | "stockContributions" | "nextSteps"> & {
  categories: Record<string, number>;
  stockContributions: StockContribution[];
  nextSteps: string[];
};

/**
 * 포트폴리오 분석 요약 타입 (수동 보강)
 */
export interface AnalysisSummaryResponse {
  valuation: PortfolioValuationResponse;
  diversification: PortfolioDiversificationResponse;
  advice?: AdviceResponse | null;
}

/**
 * 섹터 비교 데이터 포인트
 */
export interface SectorComparisonPoint {
  date: string;
  sectorReturn: number;
  benchmarkReturn: number;
}

/**
 * 섹터 시장 비교 응답 타입
 */
export interface SectorComparisonResponse {
  sectorCode: string;
  sectorName: string;
  benchmarkName: string;
  comparisonData: SectorComparisonPoint[];
}

/**
 * 인증 관련 타입
 */
export type LoginRequest = components["schemas"]["LoginRequest"];
export type LoginResponse = NonNullable<components["schemas"]["LoginResponse"]["data"]>;

export type ReissueRequest = components["schemas"]["ReissueRequest"];
export type ReissueResponse = NonNullable<components["schemas"]["ReissueResponse"]["data"]>;

/**
 * 포트폴리오 관련 타입
 */
export type PortfolioValuationResponse = NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-analysis-valuation1906810676"]["data"]>;

/** 다각화 분석 전체 데이터 */
export type PortfolioDiversificationResponse = NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-analysis-diversification-1682980467"]["data"]>;

/** 자산 비중 정보 (추출) */
export type AssetRatio = NonNullable<PortfolioDiversificationResponse["assetRatios"]>[number];

/** 섹터 비중 정보 (추출) */
export type SectorRatio = NonNullable<PortfolioDiversificationResponse["sectorRatios"]>[number];

/** 국가별 비중 정보 (추출) */
export type CountryRatio = NonNullable<PortfolioDiversificationResponse["countryRatios"]>[number];

/** 리밸런싱 전체 응답 */
export type PortfolioRebalancingResponse = NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-analysis-rebalancing1494527279"]["data"]>;

/** 리밸런싱 아이템 정보 (추출) */
export type RebalancingItem = NonNullable<PortfolioRebalancingResponse["items"]>[number] & {
  name?: string;
};

export type AssetType = "STOCK" | "ETF" | "CRYPTO" | "BOND" | "CASH";

/** 
 * Swagger에서 never[]로 깨진 PortfolioItem 타입을 수동으로 보강하여 정합성을 맞춥니다.
 */
export interface PortfolioItemResponse {
  symbol: string;
  name?: string;
  quantity: number;
  purchasePrice: number;
  currency: string;
  assetType: AssetType;
  purchaseAmount: number;
  targetWeight: number;
}

/**
 * PortfolioResponse의 items 필드가 never[]로 깨져있을 수 있으므로 Omit 후 재정의합니다.
 */
export type PortfolioResponse = Omit<NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-2030071977"]["data"]>, "items"> & {
  items: PortfolioItemResponse[];
};

/**
 * 섹터 관련 타입
 */
export type SectorRankingItem = NonNullable<components["schemas"]["SectorRankingResponse"]["data"]>[number];
export type SectorRankingResponse = NonNullable<components["schemas"]["SectorRankingResponse"]["data"]>;

/** 섹터 수급 랭킹 아이템 */
export interface SectorSupplyItem {
  /** 섹터 코드 */
  sectorCode: string;
  /** 섹터 이름 */
  sectorName: string;
  /** 외국인 순매수 금액 */
  netForeignBuyAmount: number;
  /** 기관 순매수 금액 */
  netInstBuyAmount: number;
  /** 외국인 연속 매수 일수 */
  foreignConsecutiveBuyDays: number;
  /** 기관 연속 매수 일수 */
  instConsecutiveBuyDays: number;
}

export type SectorSupplyResponse = SectorSupplyItem[];

/** 섹터 상세 정보 및 기술 지표 (추출) */
export type SectorDetailResponse = NonNullable<components["schemas"]["SectorDetailResponse"]["data"]>;
export type TechnicalIndicators = NonNullable<SectorDetailResponse["technicalIndicators"]>;
export type LeadingStock = NonNullable<SectorDetailResponse["leadingStocks"]>[number];

/** 주가 차트 조회 기간 */
export type ChartPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "ALL";

/** 주가 차트 집계 단위 */
export type ChartFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

/** 리밸런싱 주기 */
export type RebalancingPeriod = "NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY";

/**
 * 백테스트 관련 타입
 */
export interface BacktestRequest {
  /** 투자 전략 (적립식 DCA, 거치식 LUMP_SUM) */
  strategy: "DCA" | "LUMP_SUM";
  /** 투자 금액 (DCA의 경우 월 투자금액) */
  amount: number;
  /** 비교 벤치마크 티커 */
  benchmarkTicker: string;
  /**
   * 클라이언트 사이드 필터링 전용.
   * BE는 이 값을 무시하고 전체 이력 데이터를 반환한다.
   * 실제 기간 슬라이싱은 use-backtest.ts sliceByPeriod()에서 처리.
   */
  period?: ChartPeriod;
  /** 리밸런싱 주기 (NONE, MONTHLY, QUARTERLY, YEARLY) */
  rebalancingPeriod: RebalancingPeriod;
  /** 각 종목별 가상 비중 설정 (ticker -> percentage) */
  weights?: Record<string, number>;
}

/** 백테스트 일별 결과 */
export type BacktestDailyResult = NonNullable<NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-analysis-backtest-1617317571"]["data"]>["dailyResults"]>[number];

export type BacktestResponse = NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-analysis-backtest-1617317571"]["data"]>;

/**
 * 주가 데이터 관련 타입
 */
/** 특정 시점의 가격 정보 */
export type PricePoint = NonNullable<NonNullable<components["schemas"]["api-v1-stocks-ticker-prices-history-112452904"]["data"]>["prices"]>[number];

/** 벤치마크 수익률 포인트 */
export interface BenchmarkPoint {
  /** 날짜 */
  date: string;
  /** 수익률 (%) */
  returnRate: number;
}

export interface StockPriceHistoryResponse {
  /** 종목 코드 */
  ticker: string;
  /** 종목명 */
  stockName?: string;
  /** 벤치마크 이름 (ex: KOSPI) */
  benchmarkName?: string;
  /** 주가 이력 리스트 */
  prices: PricePoint[];
  /** 벤치마크 수익률 리스트 */
  benchmarks: BenchmarkPoint[];
}

/**
 * 주식 검색 결과 타입 (수동 보강)
 */
export interface StockSearchResult {
  ticker: string;
  name: string;
  sectorName: string;
  marketType: string;
  status: string;
}

/**
 * 주식 검색 응답 타입 (Slice 구조 반영 - 무한 스크롤 적합)
 */
export type StockSearchResponse = Omit<NonNullable<components["schemas"]["api-v1-stocks-search-252012140"]["data"]>, "content"> & {
  content: StockSearchResult[];
  /** BE SliceResponse hasNext 필드 */
  hasNext: boolean;
  // number, last 필드는 기반 스키마에 이미 포함됨
};

export type TradeDirection = "BUY" | "SELL";

export interface StockSupplyRankingItem {
  ticker: string;
  stockName: string;
  sectorName: string | null;
  currentPrice: number;
  fluctuationRate: number;
  netBuyingQuantity: number;
  netBuyingAmount: number;
  transactionAmount: number;
}

export interface StockSupplyRankingResponse {
  requestedDate: string | null;
  effectiveDate: string | null;
  institutionItems: StockSupplyRankingItem[];
  foreignItems: StockSupplyRankingItem[];
}

export interface StockSupplyRankingParams {
  date?: string;
  direction?: TradeDirection;
  limit?: number;
}

/**
 * 신규 상장 종목 타입
 */
export type NewListingStock = NonNullable<components["schemas"]["api-v1-stocks-new-listings562932331"]["data"]>[number];

/**
 * 보유 주식 관련 타입 (추출 기반 보강)
 */
export type HoldingStock = PortfolioItemResponse & {
  name: string;
  currentPrice: number;
  return: number;
  isUp: boolean;
};

/**
 * 관심 종목 관련 타입
 */
export type WatchlistGroup = NonNullable<components["schemas"]["api-v1-watchlist-groups15903716"]["data"]>[number];

/** 관심 종목 상세 응답 전체 */
export type WatchlistItemsResponse = NonNullable<components["schemas"]["api-v1-watchlist-groups-groupId-items104135515"]["data"]>;

/** 개별 관심 종목 (추출) */
export type WatchlistStock = NonNullable<WatchlistItemsResponse["items"]>[number];

export interface WatchlistItemListResponse {
  /** 그룹 이름 */
  groupName: string;
  /** 종목 리스트 */
  items: WatchlistStock[];
}

/** 포트폴리오 종목 간 상관관계 행렬 (ticker → ticker → 상관계수) */
export type CorrelationMatrix = Record<string, Record<string, number>>;

/**
 * AI 조언 응답 타입
 */
export type AdviceResponse = NonNullable<components["schemas"]["api-v1-portfolios-portfolioId-advice-latest-337529530"]["data"]>;

export interface CreatePortfolioItemRequest {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currency: string;
  assetType: AssetType;
  targetWeight: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description: string;
  items: CreatePortfolioItemRequest[];
}

export interface UpdatePortfolioRequest {
  name: string;
  description: string;
  items: CreatePortfolioItemRequest[];
}

export interface CreateWatchlistGroupRequest {
  name: string;
}

export interface AddWatchlistItemRequest {
  ticker: string;
  note?: string;
}

export interface UpdateWatchlistItemNoteRequest {
  note: string;
}
