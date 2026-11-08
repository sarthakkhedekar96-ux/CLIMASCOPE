/**
 * CLIMASCOPE Authoritative Climate Risk Classification Module
 * ===========================================================
 *
 * Defines the singular, authoritative municipal risk classification tiers,
 * thresholds, and color scales for CLIMASCOPE across all views and GIS layers.
 *
 * Established Thresholds:
 * - Score > 75.0:          CRITICAL (#DC3545)
 * - 60.0 <= Score <= 75.0: ELEVATED (#F59E0B)
 * - 40.0 <= Score < 60.0:  MODERATE (#0EA5E9)
 * - Score < 40.0:          STABLE   (#16A34A)
 *
 * Boundary Test Cases:
 * - 39.9 -> STABLE
 * - 40.0 -> MODERATE
 * - 59.9 -> MODERATE
 * - 60.0 -> ELEVATED
 * - 75.0 -> ELEVATED
 * - 75.1 -> CRITICAL
 */

export type RiskBadge = 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'STABLE';

export function getClimateRiskTier(score: number): RiskBadge {
  if (score > 75.0) {
    return 'CRITICAL';
  } else if (score >= 60.0) {
    return 'ELEVATED';
  } else if (score >= 40.0) {
    return 'MODERATE';
  } else {
    return 'STABLE';
  }
}

export const RISK_COLORS: Record<RiskBadge, string> = {
  CRITICAL: '#DC3545',
  ELEVATED: '#F59E0B',
  MODERATE: '#0EA5E9',
  STABLE: '#16A34A',
};

export function getRiskColor(scoreOrBadge: number | string): string {
  if (typeof scoreOrBadge === 'number') {
    return RISK_COLORS[getClimateRiskTier(scoreOrBadge)];
  }
  const badge = scoreOrBadge.toUpperCase() as RiskBadge;
  return RISK_COLORS[badge] || '#16A34A';
}
