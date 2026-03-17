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
export interface TechnicalIndicators {
  /** 5일 이동평균선 */
  ma5: number | null;
  /** 20일 이동평균선 */
  ma20: number | null;
  /** 14일 상대강도지수 (RSI) */
  rsi14: number | null;
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
  benchmarks: any[];
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
