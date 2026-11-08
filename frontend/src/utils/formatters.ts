/**
 * CLIMASCOPE Municipal Financial Intelligence Formatter
 *
 * Provides Indian Rupee (INR) formatting, Lakh and Crore conversions,
 * and locale-aware Indian numbering (e.g. ₹1,50,000, ₹12.50 Lakh, ₹1.50 Crore).
 */

export interface FormatINROptions {
  decimals?: number;
  compact?: boolean;
  showSymbol?: boolean;
  unit?: 'auto' | 'raw' | 'lakh' | 'crore';
}

/**
 * Formats a numerical value in Indian Rupee notation.
 * Examples:
 *   formatINR(150000) => "₹1,50,000"
 *   formatINR(1250000, { unit: 'lakh' }) => "₹12.50 Lakh"
 *   formatINR(15000000, { unit: 'crore' }) => "₹1.50 Crore"
 *   formatINR(2500000, { compact: true }) => "₹25.0 Lakh"
 */
export function formatINR(
  value: number | undefined | null,
  options: FormatINROptions = {}
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹0';
  }

  const {
    decimals = 2,
    compact = false,
    showSymbol = true,
    unit = 'auto'
  } = options;

  const symbol = showSymbol ? '₹' : '';
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (unit === 'crore' || (unit === 'auto' && absVal >= 10000000)) {
    const cr = absVal / 10000000;
    const formatted = cr.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return compact ? `${sign}${symbol}${formatted} Cr` : `${sign}${symbol}${formatted} Crore`;
  }

  if (unit === 'lakh' || (unit === 'auto' && absVal >= 100000)) {
    const lk = absVal / 100000;
    const formatted = lk.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${sign}${symbol}${formatted} Lakh`;
  }

  // Standard Indian numbering (e.g. 1,50,000)
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  return `${sign}${symbol}${formatted}`;
}

/**
 * Formats explicitly in Lakhs (e.g. "₹25.50 Lakh").
 */
export function formatINRLakh(
  value: number | undefined | null,
  decimals: number = 2
): string {
  return formatINR(value, { unit: 'lakh', decimals });
}

/**
 * Formats explicitly in Crores (e.g. "₹1.25 Crore").
 */
export function formatINRCrore(
  value: number | undefined | null,
  decimals: number = 2
): string {
  return formatINR(value, { unit: 'crore', decimals });
}

/**
 * Short label for compact charts and axis ticks (e.g. "₹10L", "₹1Cr").
 */
export function formatINRTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `₹${(value / 100000).toFixed(0)}L`;
  }
  if (abs >= 1000) {
    return `₹${(value / 1000).toFixed(0)}k`;
  }
  return `₹${value}`;
}
