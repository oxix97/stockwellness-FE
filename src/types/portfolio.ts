export type AssetType = "STOCK" | "CASH" | "CRYPTO" | "ETF" | "BOND";
export type Currency = "KRW" | "USD";

export interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  currency: string;
  assetType: AssetType;
  purchaseAmount: number;
  currentValue?: number;
  returnRate?: number;
  targetWeight: number;
}

export interface Portfolio {
  id: number;
  name: string;
  description: string;
  items: PortfolioItem[];
  totalEvaluationAmount: number;
  totalReturnRate: number;
}

export interface PortfolioValuation {
  totalPurchaseAmount: number;
  totalEvaluationAmount: number;
  totalGainLoss: number;
  totalReturnRate: number;
  dailyGainLoss: number;
  dailyReturnRate: number;
}

export interface Ratio {
  category: string;
  ratio: number;
}

export interface Diversification {
  assetRatios: Ratio[];
  sectorRatios: Ratio[];
  countryRatios: Ratio[];
}

export interface RebalancingItem {
  symbol: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  diffWeight: number;
  recommendQuantity: number;
}

export interface RebalancingGuide {
  lastUpdated: string;
  items: RebalancingItem[];
}

export interface PortfolioSummary {
  valuation: PortfolioValuation;
  diversification: Diversification;
  rebalancing: RebalancingGuide;
  itemContributions: Record<string, number>;
}

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
