export type TrendTone = "up" | "down" | "neutral";

export function getTrendTone(value: number): TrendTone {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
}

export function getTrendClassName(
  value: number,
  options?: {
    positive?: string;
    negative?: string;
    neutral?: string;
  },
) {
  const {
    positive = "text-up",
    negative = "text-down",
    neutral = "text-muted-foreground",
  } = options ?? {};

  const tone = getTrendTone(value);

  if (tone === "up") return positive;
  if (tone === "down") return negative;
  return neutral;
}
