import type {
  PortfolioRebalancingResponse,
  PortfolioValuationResponse,
  RebalancingItem,
  ValuationStatus,
} from "@/types/api";

export function getValuationStatus(valuation: PortfolioValuationResponse | undefined): ValuationStatus {
  if (!valuation) return "UNAVAILABLE";
  if (valuation.valuationStatus) {
    if (valuation.valuationStatus === "COMPLETE" && (valuation.missingSymbols?.length ?? 0) > 0) {
      return "PARTIAL";
    }
    return valuation.valuationStatus;
  }
  if ((valuation.missingSymbols?.length ?? 0) > 0) return "PARTIAL";
  if (valuation.currentTotalValue == null || valuation.totalReturnRate == null) return "UNAVAILABLE";
  return "COMPLETE";
}

export type RebalancingAvailability =
  | { status: "unavailable"; missingSymbols: string[] }
  | { status: "zero_total"; missingSymbols: string[] }
  | { status: "ready"; missingSymbols: string[] };

export function getRebalancingAvailability({
  valuation,
  rebalancing,
}: {
  valuation: PortfolioValuationResponse | undefined;
  rebalancing: PortfolioRebalancingResponse | undefined;
}): RebalancingAvailability {
  const missingSymbols = valuation?.missingSymbols ?? [];
  const hasValuationProblem =
    valuation == null ||
    getValuationStatus(valuation) !== "COMPLETE" ||
    valuation.currentTotalValue == null ||
    !Number.isFinite(valuation.currentTotalValue);

  const rebalancingTotalValue: number | null | undefined = rebalancing?.totalValue;
  if (
    hasValuationProblem ||
    rebalancing == null ||
    rebalancingTotalValue == null ||
    !Number.isFinite(rebalancingTotalValue)
  ) {
    return { status: "unavailable", missingSymbols };
  }

  if (valuation.currentTotalValue === 0 || rebalancingTotalValue === 0) {
    return { status: "zero_total", missingSymbols };
  }

  return { status: "ready", missingSymbols };
}

export type RebalancingItemDecision = "unavailable" | "none" | "buy" | "sell";

export function getRebalancingItemDecision(item: RebalancingItem): RebalancingItemDecision {
  const price: number | null | undefined = item.currentPrice;
  const qty: number | null | undefined = item.recommendedQuantity;
  if (price == null || !Number.isFinite(price) || price <= 0 || qty == null || !Number.isFinite(qty)) {
    return "unavailable";
  }
  if (qty === 0) return "none";
  return qty > 0 ? "buy" : "sell";
}
