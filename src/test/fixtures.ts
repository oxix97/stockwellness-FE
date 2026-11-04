import {
  PortfolioValuationResponse,
  PortfolioDiversificationResponse,
  PortfolioRebalancingResponse,
  PortfolioResponse,
  RebalancingItem,
  AdviceResponse,
  WatchlistGroup,
  WatchlistItemListResponse,
} from "@/types/api";
import { NotificationSettings } from "@/api/member";

/**
 * 테스트용 픽스처 데이터
 * 각 factory 함수는 기본값을 제공하며, 오버라이드를 통해 변형할 수 있다.
 */

export function makeValuation(overrides?: Partial<PortfolioValuationResponse>): PortfolioValuationResponse {
  return {
    totalPurchaseAmount: 10_000_000,
    currentTotalValue: 11_000_000,
    totalProfitLoss: 1_000_000,
    totalReturnRate: 10.0,
    dailyProfitLoss: 50_000,
    dailyReturnRate: 0.5,
    cagr: 10.0,
    volatility: 12.0,
    mdd: -5.0,
    sharpeRatio: 1.5,
    beta: 0.9,
    alpha: 1.2,
    totalInstitutionalNetBuying: 0,
    totalForeignNetBuying: 0,
    totalPersonNetBuying: 0,
    valuationStatus: "COMPLETE",
    asOfDate: "2026-03-23",
    missingSymbols: [],
    ...overrides,
  } as PortfolioValuationResponse;
}

export function makeDiversification(overrides?: Partial<PortfolioDiversificationResponse>): PortfolioDiversificationResponse {
  return {
    totalValue: 11_000_000,
    assetRatios: [
      { name: "STOCK", value: 90 },
      { name: "CASH", value: 10 },
    ],
    sectorRatios: [
      { name: "전기전자", value: 50 },
      { name: "바이오", value: 40 },
    ],
    countryRatios: [{ name: "KR", value: 100 }],
    ...overrides,
  };
}

export function makeRebalancingItem(overrides?: Partial<RebalancingItem>): RebalancingItem {
  return {
    symbol: "005930",
    name: "삼성전자",
    currentWeight: 55,
    targetWeight: 50,
    diffWeight: 5,
    currentQuantity: 10,
    recommendedQuantity: 9,
    currentPrice: 75_000,
    expectedTradeAmount: 75_000,
    ...overrides,
  };
}

export function makeRebalancing(overrides?: Partial<PortfolioRebalancingResponse>): PortfolioRebalancingResponse {
  return {
    totalValue: 11_000_000,
    items: [makeRebalancingItem()],
    ...overrides,
  };
}

export function makeAdvice(overrides?: Partial<AdviceResponse>): AdviceResponse {
  return {
    content: "포트폴리오 분산을 강화하세요.",
    action: "DIVERSIFICATION",
    createdAt: "2026-03-23T10:00:00",
    ...overrides,
  };
}

export function makePortfolio(overrides?: Partial<PortfolioResponse>): PortfolioResponse {
  return {
    id: 1,
    name: "테스트 포트폴리오",
    description: "테스트용",
    totalPurchaseAmount: 10_000_000,
    currentTotalValue: 11_000_000,
    totalReturnRate: 10.0,
    items: [
      {
        symbol: "005930",
        name: "삼성전자",
        quantity: 10,
        purchasePrice: 70_000,
        currentPrice: 75_000,
        currency: "KRW",
        assetType: "STOCK",
        purchaseAmount: 700_000,
        currentValue: 750_000,
        returnRate: 7.1,
        targetWeight: 50,
      },
    ],
    ...overrides,
  };
}

export function makeWatchlistGroup(overrides?: Partial<WatchlistGroup>): WatchlistGroup {
  return {
    id: 1,
    name: "관심 그룹",
    itemCount: 2,
    ...overrides,
  };
}

export function makeWatchlistItems(overrides?: Partial<WatchlistItemListResponse>): WatchlistItemListResponse {
  return {
    groupName: "관심 그룹",
    items: [
      {
        ticker: "005930",
        name: "삼성전자",
        currentPrice: 75_000,
        fluctuationRate: 1.2,
        note: "",
        rsi: 55,
        rsiStatus: "NEUTRAL",
        aiInsight: "안정적 흐름 유지 중",
      },
    ],
    ...overrides,
  };
}

export function makeNotificationSettings(overrides?: Partial<NotificationSettings>): NotificationSettings {
  return {
    rebalancing: true,
    marketAlert: false,
    newListing: true,
    ...overrides,
  };
}
