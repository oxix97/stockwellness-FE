/**
 * 백엔드 공통 응답 구조 (Java 21 record 대응)
 */
export interface FieldError {
  field: string;
  value: string;
  reason: string;
}

export interface ApiResponse<T> {
  success: boolean;       // @JsonProperty("success") 반영
  status: number;         // HTTP 상태 코드
  code: string;           // 서비스 내부 코드
  message: string;        // 응답 메시지
  data: T;                // 실제 비즈니스 데이터
  timestamp: string;      // 응답 생성 시간 (ISO-8601)
  traceId: string | null; // 에러 추적용 ID
  errors: FieldError[];   // 상세 필드 에러 목록
}

/**
 * 인증 관련 타입
 */
export interface LoginRequest {
  /** 소셜 서비스로부터 받은 인가 코드 */
  code: string;
  /** CSRF 방지를 위한 상태 값 */
  state?: string;
  /** 소셜 로그인 제공자 (GOOGLE, KAKAO, NAVER) */
  provider: "GOOGLE" | "KAKAO" | "NAVER";
}

export interface LoginResponse {
  /** 사용자 ID */
  memberId: number;
  /** 이메일 */
  email: string;
  /** 닉네임 */
  nickname: string;
  /** 액세스 토큰 */
  accessToken: string;
  /** 리프레시 토큰 */
  refreshToken: string;
}

export interface ReissueRequest {
  /** 리프레시 토큰 */
  refreshToken: string;
}

export interface ReissueResponse {
  /** 새 액세스 토큰 */
  accessToken: string;
  /** 새 리프레시 토큰 */
  refreshToken: string;
}

/**
 * 포트폴리오 관련 타입
 */
export interface PortfolioValuationResponse {
  /** 총 매수 금액 */
  totalPurchaseAmount: number;
  /** 현재 총 평가 금액 */
  currentTotalValue: number;
  /** 총 손익 금액 */
  totalProfitLoss: number;
  /** 총 수익률 */
  totalReturnRate: number;
  /** 일간 손익 금액 */
  dailyProfitLoss: number;
  /** 일간 수익률 */
  dailyReturnRate: number;
  /** 최대 낙폭 (Maximum Drawdown) */
  mdd: number;
  /** 샤프 지수 (위험 대비 수익성 지표) */
  sharpeRatio: number;
  /** 베타 (시장 민감도 지표) */
  beta: number;
}

/** 자산 비중 정보 */
export interface AssetRatio {
  /** 자산 종류 (주식, 현금 등) */
  name: "STOCK" | "CASH";
  /** 비중 값 (0-100) */
  value: number;
}

/** 섹터 비중 정보 */
export interface SectorRatio {
  /** 섹터 이름 */
  name: string;
  /** 비중 값 (0-100) */
  value: number;
}

/** 국가별 비중 정보 */
export interface CountryRatio {
  /** 국가 이름 */
  name: string;
  /** 비중 값 (0-100) */
  value: number;
}

export interface PortfolioDiversificationResponse {
  /** 총 평가 금액 */
  totalValue: number;
  /** 자산 구성 비중 */
  assetRatios: AssetRatio[];
  /** 섹터 구성 비중 */
  sectorRatios: SectorRatio[];
  /** 국가별 구성 비중 */
  countryRatios: CountryRatio[];
}

/** 리밸런싱 아이템 정보 */
export interface RebalancingItem {
  /** 종목 코드 */
  symbol: string;
  /** 현재 비중 (%) */
  currentWeight: number;
  /** 목표 비중 (%) */
  targetWeight: number;
  /** 비중 차이 (%) */
  diffWeight: number;
  /** 현재 수량 */
  currentQuantity: number;
  /** 추천 수량 (리밸런싱 후 목표 수량) */
  recommendedQuantity: number;
  /** 현재가 */
  currentPrice: number;
  /** 예상 거래 금액 */
  expectedTradeAmount: number;
}

export interface PortfolioRebalancingResponse {
  /** 총 평가 금액 */
  totalValue: number;
  /** 리밸런싱 항목 리스트 */
  items: RebalancingItem[];
}

/**
 * 섹터 관련 타입
 */
export interface SectorRankingItem {
  /** 섹터 코드 */
  sectorCode: string;
  /** 섹터 이름 */
  sectorName: string;
  /** 현재 지수/가격 */
  currentPrice: number;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 과열 여부 */
  isOverheated: boolean;
}

export type SectorRankingResponse = SectorRankingItem[];

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

export interface TechnicalIndicators {
  /** 5일 이동평균선 */
  ma5: number | null;
  /** 20일 이동평균선 */
  ma20: number | null;
  /** 60일 이동평균선 */
  ma60: number | null;
  /** 120일 이동평균선 */
  ma120: number | null;
  /** 14일 상대강도지수 (RSI) */
  rsi14: number | null;
  /** MACD */
  macd: number | null;
  /** MACD 시그널 */
  macdSignal: number | null;
  /** 볼린저 밴드 상단 */
  bollingerUpper: number | null;
  /** 볼린저 밴드 중간 */
  bollingerMid: number | null;
  /** 볼린저 밴드 하단 */
  bollingerLower: number | null;
  /** ADX (추세 강도) */
  adx: number | null;
  /** +DI */
  plusDi: number | null;
  /** -DI */
  minusDi: number | null;
  /** 이동평균선 정배열 상태 */
  alignmentStatus: string | null;
  /** 골든 크로스 여부 */
  isGoldenCross: boolean | null;
  /** 데드 크로스 여부 */
  isDeadCross: boolean | null;
  /** MACD 크로스 여부 */
  isMacdCross: boolean | null;
}

/** 섹터 내 주도주 정보 */
export interface LeadingStock {
  /** 종목 코드 */
  ticker: string;
  /** 종목 이름 */
  name: string;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 거래량 */
  tradeVolume: number;
  /** 거래대금 */
  transactionAmt: number;
}

export interface SectorDetailResponse {
  /** 섹터 코드 */
  sectorCode: string;
  /** 섹터 이름 */
  sectorName: string;
  /** 기준 날짜 */
  baseDate: string;
  /** 현재 지수/가격 */
  currentPrice: number;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 기술적 지표 */
  technicalIndicators: TechnicalIndicators;
  /** 과열 여부 */
  isOverheated: boolean;
  /** 진단 메시지 */
  diagnosisMessage: string;
  /** 주도주 리스트 */
  leadingStocks: LeadingStock[];
}

/**
 * 백테스트 관련 타입
 */
export interface BacktestRequest {
  /** 투자 전략 (적립식 DCA, 거치식 LUMP_SUM) */
  strategy: "DCA" | "LUMP_SUM";
  /** 투자 금액 */
  amount: number;
  /** 비교 벤치마크 티커 */
  benchmarkTicker: string;
}

/** 백테스트 일별 결과 */
export interface BacktestDailyResult {
  /** 날짜 */
  date: string;
  /** 총 자산 평가액 */
  totalValue: number;
  /** 총 투자 원금 */
  totalInvested: number;
  /** 누적 수익률 (%) */
  returnRate: number;
  /** 벤치마크 수익률 (%) */
  benchmarkReturnRate: number;
}

export interface BacktestResponse {
  /** 일별 백테스트 결과 리스트 */
  dailyResults: BacktestDailyResult[];
}

/**
 * 주가 데이터 관련 타입
 */
/** 특정 시점의 가격 정보 */
export interface PricePoint {
  /** 날짜 */
  date: string;
  /** 시가 */
  open: number;
  /** 고가 */
  high: number;
  /** 저가 */
  low: number;
  /** 종가 */
  close: number;
  /** 수정 종가 */
  adjClose: number;
  /** 거래량 */
  volume: number;
}

export interface StockPriceHistoryResponse {
  /** 종목 코드 */
  ticker: string;
  /** 주가 이력 리스트 */
  prices: PricePoint[];
  /** 벤치마크 데이터 */
  benchmarks: PricePoint[];
}

/**
 * 주식 검색 결과 타입
 */
export interface StockSearchResult {
  /** 티커 */
  ticker: string;
  /** 종목명 */
  name: string;
  /** 섹터명 */
  sectorName: string;
  /** 마켓 타입 (KOSPI, KOSDAQ 등) */
  marketType: string;
  /** 종목 상태 (ACTIVE, HALTED 등) */
  status: string;
}

/**
 * 주식 검색 응답 타입 (Slice 구조 반영 - 무한 스크롤 적합)
 */
export interface StockSearchResponse {
  /** 검색 결과 리스트 */
  content: StockSearchResult[];
  /** 현재 페이지 번호 (0부터 시작) */
  number: number;
  /** 페이지 사이즈 */
  size: number;
  /** 현재 페이지 엘리먼트 수 */
  numberOfElements: number;
  /** 마지막 페이지 여부 */
  last: boolean;
  /** 첫 번째 페이지 여부 */
  first: boolean;
  /** 다음 페이지 존재 여부 (Slice 핵심) */
  hasNext: boolean;
  /** 결과 비어있음 여부 */
  empty: boolean;
}

/**
 * 신규 상장 종목 타입
 */
export interface NewListingStock {
  /** 티커 */
  ticker: string;
  /** 종목명 */
  name: string;
  /** 마켓 타입 (KOSPI, KOSDAQ 등) */
  marketType: string;
  /** 섹터명 */
  sectorName: string;
  /** 종목 상태 */
  status: string;
}

/**
 * 섹터 추천 관련 타입
 */
export interface RecommendedSector {
  /** 섹터 코드 */
  sectorCode: string;
  /** 섹터 이름 */
  sectorName: string;
  /** 현재 지수/가격 */
  currentPrice: number;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 과열 여부 */
  isOverheated: boolean;
}

/**
 * 보유 주식 관련 타입
 */
export interface HoldingStock {
  /** 종목 코드 */
  symbol: string;
  /** 종목 이름 */
  name: string;
  /** 보유 수량 */
  shares: number;
  /** 현재가 */
  currentPrice: number;
  /** 평균 매수가 */
  avgPrice: number;
  /** 수익률 (%) */
  return: number;
  /** 상승 여부 (UI 컬러 결정용) */
  isUp: boolean;
}

/**
 * 관심 종목 관련 타입
 */
export interface WatchlistGroup {
  /** 그룹 ID */
  id: number;
  /** 그룹 이름 */
  name: string;
  /** 포함된 종목 수 */
  itemCount: number;
}

export interface WatchlistStock {
  /** 종목 티커 */
  ticker: string;
  /** 종목 이름 */
  name: string;
  /** 현재가 */
  currentPrice: number;
  /** 등락률 (%) */
  fluctuationRate: number;
  /** 투자 메모 */
  note: string;
  /** RSI 지표 */
  rsi: number;
  /** RSI 상태 */
  rsiStatus: string;
  /** AI 한줄 분석 */
  aiInsight: string;
}

export interface WatchlistItemListResponse {
  /** 그룹 이름 */
  groupName: string;
  /** 종목 리스트 */
  items: WatchlistStock[];
}
