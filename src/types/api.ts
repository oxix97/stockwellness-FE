import type { operations } from "./schema";

/**
 * OpenAPI operation helpers.  Endpoint types are intentionally derived from
 * operation IDs instead of the generated response hash names; the latter are
 * unstable whenever REST Docs regenerates the contract.
 */
type JsonBody<T> = T extends { content: infer Content }
  ? Content extends Record<string, infer Body>
    ? Body
    : never
  : never;

type OperationResponse<
  Operation extends keyof operations,
  Status extends PropertyKey,
> = Status extends keyof operations[Operation]["responses"]
  ? JsonBody<operations[Operation]["responses"][Status]>
  : never;

type OperationData<
  Operation extends keyof operations,
  Status extends PropertyKey = 200,
> = NonNullable<
  OperationResponse<Operation, Status> extends { data?: infer Data }
    ? Data
    : never
>;

type OperationRequest<Operation extends keyof operations> =
  NonNullable<operations[Operation]["requestBody"]> extends { content: infer Content }
    ? Content extends Record<string, infer Body>
      ? Body
      : never
    : never;

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
export type StockDetailResult = OperationData<"stock-get-detail">;

/**
 * 포트폴리오 건강 진단 타입 (수동 보강)
 */
export interface StockContribution {
  name: string;
  mainContribution: string;
  score: number;
  reason: string;
}

export type DiagnosisResponse = Omit<OperationData<"portfolio-diagnose">, "categories" | "stockContributions" | "nextSteps"> & {
  categories: Record<string, number>;
  stockContributions: StockContribution[];
  nextSteps: string[];
};

/**
 * 포트폴리오 분석 요약 타입 (수동 보강)
 */
export type ValuationStatus = "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
export type PriceStatus = "AVAILABLE" | "STALE" | "MISSING";

export interface AnalysisSummaryResponse {
  valuation: PortfolioValuationResponse;
  diversification: PortfolioDiversificationResponse;
  rebalancing: PortfolioRebalancingResponse;
  itemContributions: Record<string, number>;
}

/**
 * 섹터 비교 데이터 포인트
 */
export interface SectorComparisonPoint {
  date: string;
  indexValue: number;
  sectorRate: number; // sectorReturn -> sectorRate
  marketRate: number; // benchmarkReturn -> marketRate
  relativeStrength: number; // 추가
}

/**
 * 섹터 시장 비교 응답 타입
 */
export interface SectorComparisonResponse {
  sectorCode: string;
  sectorName: string;
  baseDate: string; // 추가
  sectorChangeRate: number; // 추가
  marketChangeRate: number; // 추가
  relativeStrength: number; // 추가
  performanceStatus: "OUTPERFORM" | "UNDERPERFORM" | "NEUTRAL"; // 추가
  historicalComparison: SectorComparisonPoint[]; // comparisonData -> historicalComparison
}

/**
 * 인증 관련 타입
 */
/** OAuth callback exchange request (the raw login endpoint is removed). */
export type AuthExchangeRequest = OperationRequest<"auth-exchange">;
export type AuthExchangeResponse = OperationData<"auth-exchange">;

/** @deprecated Use AuthExchangeRequest; retained for callers during migration. */
export type LoginRequest = AuthExchangeRequest;
/** @deprecated Use AuthExchangeResponse; retained for callers during migration. */
export type LoginResponse = AuthExchangeResponse;

export type ReissueRequest = OperationRequest<"auth-reissue">;
export type ReissueResponse = OperationData<"auth-reissue">;

export type E2eAttestationRequest = OperationRequest<"test-support-e2e-attestation">;
export type E2eAttestationResponse = OperationData<"test-support-e2e-attestation">;

/**
 * 포트폴리오 관련 타입
 */
type GeneratedPortfolioValuation = OperationData<"portfolio-analysis-value">;

/**
 * Valuation is allowed to be partial while one or more EOD prices are absent.
 * Keep the nullable fields explicit because OpenAPI generators differ in how
 * they render `oneOf: [number, null]`.
 */
export type PortfolioValuationResponse = Omit<
  GeneratedPortfolioValuation,
  | "currentTotalValue"
  | "totalProfitLoss"
  | "totalReturnRate"
  | "dailyProfitLoss"
  | "dailyReturnRate"
  | "asOfDate"
  | "missingSymbols"
  | "valuationStatus"
> & {
  currentTotalValue: number | null;
  totalProfitLoss: number | null;
  totalReturnRate: number | null;
  dailyProfitLoss: number | null;
  dailyReturnRate: number | null;
  asOfDate: string | null;
  missingSymbols: string[];
  valuationStatus: ValuationStatus;
};

/** 다각화 분석 전체 데이터 */
export type PortfolioDiversificationResponse = OperationData<"portfolio-analysis-diversification">;

/** 자산 비중 정보 (추출) */
export type AssetRatio = NonNullable<PortfolioDiversificationResponse["assetRatios"]>[number];

/** 섹터 비중 정보 (추출) */
export type SectorRatio = NonNullable<PortfolioDiversificationResponse["sectorRatios"]>[number];

/** 국가별 비중 정보 (추출) */
export type CountryRatio = NonNullable<PortfolioDiversificationResponse["countryRatios"]>[number];

/** 리밸런싱 전체 응답 */
export type PortfolioRebalancingResponse = OperationData<"portfolio-analysis-rebalancing">;

/** 리밸런싱 아이템 정보 (추출) */
export type RebalancingItem = {
  symbol: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  diffWeight: number;
  recommendedQuantity: number;
  currentPrice: number;
  expectedTradeAmount: number;
  currentQuantity: number;
};

export type AssetType = "STOCK" | "ETF" | "CRYPTO" | "BOND" | "CASH";

/** 
 * Swagger에서 never[]로 깨진 PortfolioItem 타입을 수동으로 보강하여 정합성을 맞춥니다.
 */
export interface PortfolioItemResponse {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  priceStatus?: PriceStatus;
  priceAsOfDate?: string | null;
  currentPrice?: number | null;
  currency: string;
  assetType: AssetType;
  purchaseAmount: number;
  currentValue?: number | null;
  returnRate?: number | null;
  targetWeight: number;
}

/**
 * PortfolioResponse의 items 필드가 never[]로 깨져있을 수 있으므로 Omit 후 재정의합니다.
 */
export type PortfolioResponse = Omit<
  OperationData<"portfolio-get">,
  "items" | "asOfDate" | "currentTotalValue" | "totalReturnRate" | "missingSymbols" | "valuationStatus"
> & {
  asOfDate?: string | null;
  currentTotalValue?: number | null;
  totalReturnRate?: number | null;
  missingSymbols?: string[];
  valuationStatus?: ValuationStatus;
  items: PortfolioItemResponse[];
};

/**
 * 섹터 관련 타입
 */
export type SectorRankingResponse = OperationData<"sector-ranking">;
export type SectorRankingItem = SectorRankingResponse[number];

/** 주도주 정보 */
export interface LeadingStock {
  name: string;
  ticker: string;
  currentPrice: number;
  changePrice: number;
  fluctuationRate: number;
  tradeVolume: number;
  transactionAmt: number;
}
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
export type TechnicalIndicators = NonNullable<OperationData<"sector-detail">["technicalIndicators"]>;
export type SectorDetailResponse = Omit<OperationData<"sector-detail">, "leadingStocks" | "technicalIndicators"> & {
  leadingStocks: LeadingStock[];
  technicalIndicators?: TechnicalIndicators | null;
};
// 중복된 LeadingStock 선언 제거

/** 주가 차트 조회 기간 */
export type ChartPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "ALL";

/** 주가 차트 집계 단위 */
export type ChartFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

/** 리밸런싱 주기 */
export type RebalancingPeriod = "NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY";

/** 백테스트가 외부에 노출하는 벤치마크 코드. 내부 티커는 서버가 매핑한다. */
export type BenchmarkCode = "KOSPI" | "KOSDAQ" | "SP500";

/** 서버 백테스트가 지원하는 기간. 소문자 기간은 계약에 포함되지 않는다. */
export type BacktestPeriod = "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "ALL";

export type BacktestStrategy = "DCA" | "LUMP_SUM";
export type BacktestCalculationMethod = "DCA_XIRR_TWR" | "LUMP_SUM_CAGR_TWR";

/** 결과 화면으로 넘기는 React Router state. query string에 금융 설정을 남기지 않는다. */
export interface BacktestRouteState {
  strategy: BacktestStrategy;
  amount: number;
  primaryBenchmark: BenchmarkCode;
  period: BacktestPeriod;
  rebalancingPeriod: RebalancingPeriod;
  dividendReinvested: boolean;
  weights: Record<string, number>;
}

/** 백테스트 실행 요청. 기본값도 화면/훅에서 대문자 계약으로 정규화한다. */
export interface BacktestRequest {
  strategy: BacktestStrategy;
  amount: number;
  primaryBenchmark: BenchmarkCode;
  period: BacktestPeriod;
  rebalancingPeriod: RebalancingPeriod;
  dividendReinvested: boolean;
  weights?: Record<string, number>;
}

/** 훅이 받는 입력은 화면 기본값을 채울 수 있도록 일부 필드를 선택적으로 허용한다. */
export type BacktestRunInput = Omit<BacktestRequest, "primaryBenchmark" | "period" | "rebalancingPeriod" | "dividendReinvested"> &
  Partial<Pick<BacktestRequest, "primaryBenchmark" | "period" | "rebalancingPeriod" | "dividendReinvested" | "weights">>;

/** 백테스트 일별 결과 */
export interface BacktestDailyResult {
  date: string;
  totalValue: number;
  totalInvested: number;
  returnRate: number;
  benchmarkReturnRate: number | null;
  benchmarkReturnRates: Partial<Record<BenchmarkCode, number>>;
}

export interface BacktestComparison {
  /** 새 계약의 외부 코드. 이전 응답과의 과도기에는 ticker도 허용한다. */
  benchmarkCode?: BenchmarkCode;
  ticker?: string;
  indexName: string;
  totalReturn: number;
  alpha: number | null;
  mdd?: number | null;
  relativeMdd?: number | null;
  beta: number | null;
}

export interface BacktestResponse {
  dailyResults: BacktestDailyResult[];
  primaryBenchmark: BenchmarkCode;
  cagr: number | null;
  xirr: number | null;
  timeWeightedReturnRate: number | null;
  calculationMethod: BacktestCalculationMethod;
  mdd: number | null;
  relativeMdd?: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  recoveryPeriod: number | null;
  totalReturnRate: number | null;
  volatility?: number | null;
  bestYearRate?: number | null;
  worstYearRate?: number | null;
  alpha: number | null;
  beta: number | null;
  comparisons: BacktestComparison[];
  aiComment: string | null;
}

export function isBacktestRouteState(value: unknown): value is BacktestRouteState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BacktestRouteState>;
  return (
    (candidate.strategy === "DCA" || candidate.strategy === "LUMP_SUM") &&
    typeof candidate.amount === "number" &&
    Number.isInteger(candidate.amount) &&
    candidate.amount > 0 &&
    (candidate.primaryBenchmark === "KOSPI" || candidate.primaryBenchmark === "KOSDAQ" || candidate.primaryBenchmark === "SP500") &&
    (candidate.period === "1W" || candidate.period === "1M" || candidate.period === "3M" || candidate.period === "6M" || candidate.period === "1Y" || candidate.period === "3Y" || candidate.period === "ALL") &&
    (candidate.rebalancingPeriod === "NONE" || candidate.rebalancingPeriod === "MONTHLY" || candidate.rebalancingPeriod === "QUARTERLY" || candidate.rebalancingPeriod === "YEARLY") &&
    typeof candidate.dividendReinvested === "boolean" &&
    !!candidate.weights &&
    typeof candidate.weights === "object" &&
    !Array.isArray(candidate.weights)
  );
}

export interface InceptionChartDailyResult {
  date: string;
  portfolioReturnRate: number;
  benchmarkReturnRates: Record<string, number>;
}

export interface InceptionChartComparison {
  indexName: string;
  ticker: string;
  totalReturn: number;
}

export interface PortfolioInceptionChartResponse {
  portfolioInceptionDate: string;
  daysElapsed: number;
  dailyResults: InceptionChartDailyResult[];
  comparisons: InceptionChartComparison[];
}

/**
 * 주가 데이터 관련 타입
 */
export interface StockReturnsResponse {
  ticker: string;
  period: string;
  currency?: "KRW" | "USD";
  stockReturnRate: number;
  benchmarkReturnRate: number;
}

/** 특정 시점의 가격 정보 */
export type PricePoint = NonNullable<NonNullable<OperationData<"stock-price-history">["prices"]>[number]>;

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
  /** 가격 단위 (백엔드가 제공하지 않는 구버전 응답에서는 티커로 안전하게 추정) */
  currency?: "KRW" | "USD";
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
export type StockSearchResponse = Omit<OperationData<"stock-search">, "content"> & {
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
export type NewListingStock = OperationData<"stock-new-listings">[number];

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
export interface WatchlistGroup {
  id: number;
  name: string;
  itemCount: number;
}

export interface WatchlistItemDetail {
  ticker: string;
  name: string;
  currentPrice: number | null;
  fluctuationRate: number | null;
  note: string;
  rsi: number | null;
  rsiStatus: string;
  aiInsight: string;
}

export interface WatchlistItemListResponse {
  groupName: string;
  items: WatchlistItemDetail[];
}

/** 포트폴리오 종목 간 상관관계 행렬 (ticker → ticker → 상관계수) */
export type CorrelationMatrix = Record<string, Record<string, number>>;

/**
 * AI 조언 응답 타입
 */
export type AdviceResponse = OperationData<"portfolio-advice-latest">;

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

/** 가상 포트폴리오 생성 시 서버가 EOD 가격과 수량을 계산한다. */
export interface CreateSimulatedPortfolioItemRequest {
  symbol: string;
  targetWeight: number;
}

export interface CreateSimulatedPortfolioRequest {
  name: string;
  description: string;
  totalAmount: number;
  items: CreateSimulatedPortfolioItemRequest[];
}

export interface CreateSimulatedPortfolioResponse {
  portfolioId: number;
  asOfDate: string;
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
