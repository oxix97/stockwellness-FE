import { cn } from "@/app/components/ui/utils";
import { formatSignedCurrency, formatSignedNumber, formatSignedPercent, toFiniteNumber } from "@/utils/format";
import { getTrendClassName, getTrendTone } from "@/utils/trend";

type SignedValueFormat = "percent" | "currency" | "number";

interface SignedValueLabelProps {
  value: number | string | null | undefined;
  format: SignedValueFormat;
  className?: string;
  showArrow?: boolean;
  showSign?: boolean;
  fractionDigits?: number;
  ariaLabelPrefix?: string;
  fallback?: string;
}

export function SignedValueLabel({
  value,
  format,
  className,
  showArrow = true,
  showSign = false,
  fractionDigits,
  ariaLabelPrefix,
  fallback,
}: SignedValueLabelProps) {
  if (fallback !== undefined && (value === null || value === undefined || Number.isNaN(Number(value)))) {
    return <span className={cn("text-muted-foreground tabular-nums", className)}>{fallback}</span>;
  }

  const num = toFiniteNumber(value);
  const tone = getTrendTone(num);
  const directionLabel = tone === "up" ? "상승" : tone === "down" ? "하락" : "보합";
  const text = formatSignedValue(format, value, {
    showArrow,
    showSign,
    fractionDigits,
  });
  const ariaLabel = ariaLabelPrefix ? `${ariaLabelPrefix} ${directionLabel} ${text}` : `${directionLabel} ${text}`;

  return (
    <span className={cn("tabular-nums", getTrendClassName(num), className)} aria-label={ariaLabel}>
      {text}
    </span>
  );
}

function formatSignedValue(
  format: SignedValueFormat,
  value: number | string | null | undefined,
  options: {
    showArrow: boolean;
    showSign: boolean;
    fractionDigits?: number;
  },
) {
  if (format === "currency") return formatSignedCurrency(value, options);
  if (format === "number") return formatSignedNumber(value, options);
  return formatSignedPercent(value, options);
}
