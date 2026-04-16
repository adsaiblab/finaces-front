import { RatioSetFlat } from '../models/scoring.model';
import {
  RatioSetGrouped,
  RatioValue,
  LiquidityGroup,
  SolvencyGroup,
  ProfitabilityGroup,
  CapacityGroup,
  ZScoreGroup,
} from '../models/ratio.model';

/**
 * Backend returns RatioSetFlat (plain numbers).
 * Frontend displays RatioSetGrouped (grouped pillars with RatioValue objects).
 * This mapper enriches flat ratios into display-ready grouped structures.
 */

function toRatioValue(current: any, variation_pct: any = 0, unit: RatioValue['unit'] = 'ratio'): RatioValue {
  // Pydantic serializes Decimal as strings. We must cast to number to avoid `.toFixed()` crashes.
  let parsedCurrent: number | null = null;
  if (current !== null && current !== undefined && current !== '') {
    parsedCurrent = parseFloat(String(current));
    if (isNaN(parsedCurrent)) {
      parsedCurrent = null;
    }
  }

  return {
    current: parsedCurrent,
    trend: [],
    benchmark_min: 0,
    benchmark_max: 0,
    status: 'GREEN',
    unit,
    variation_pct: variation_pct != null ? parseFloat(String(variation_pct)) : 0,
  };
}

export class RatioMapper {
  /** Backend flat → Frontend grouped (for display) */
  static fromBackendFlat(flat: any): RatioSetGrouped {
    const liquidity: LiquidityGroup = {
      current_ratio: toRatioValue(flat.current_ratio, flat.current_ratio_variation_pct),
      quick_ratio: toRatioValue(flat.quick_ratio, flat.quick_ratio_variation_pct),
      cash_ratio: toRatioValue(flat.cash_ratio, flat.cash_ratio_variation_pct),
      working_capital: toRatioValue(flat.working_capital, flat.working_capital_variation_pct, 'currency'),
      wcr: toRatioValue(flat.working_capital_requirement, flat.working_capital_requirement_variation_pct, 'currency'),
      wcr_pct_revenue: toRatioValue(flat.working_capital_requirement_pct_revenue, flat.working_capital_requirement_pct_revenue_variation_pct, '%'),
      dso_days: toRatioValue(flat.dso_days, flat.dso_days_variation_pct, 'days'),
      dpo_days: toRatioValue(flat.dpo_days, flat.dpo_days_variation_pct, 'days'),
      dio_days: toRatioValue(flat.dio_days ?? null, flat.dio_days_variation_pct ?? null, 'days'),
      cash_conversion_cycle: toRatioValue(flat.cash_conversion_cycle ?? null, flat.cash_conversion_cycle_variation_pct ?? null, 'days'),
    };

    const solvency: SolvencyGroup = {
      debt_to_equity: toRatioValue(flat.debt_to_equity, flat.debt_to_equity_variation_pct),
      financial_autonomy: toRatioValue(flat.financial_autonomy, flat.financial_autonomy_variation_pct),
      gearing: toRatioValue(flat.gearing, flat.gearing_variation_pct),
      interest_coverage: toRatioValue(flat.interest_coverage ?? null, flat.interest_coverage_variation_pct ?? null),
      debt_repayment_years: toRatioValue(flat.debt_repayment_years ?? null, flat.debt_repayment_years_variation_pct ?? null),
      negative_equity: toRatioValue(flat.negative_equity ?? 0, 0, 'binary'),
    };

    const profitability: ProfitabilityGroup = {
      net_margin: toRatioValue(flat.net_margin, flat.net_margin_variation_pct, '%'),
      ebitda_margin: toRatioValue(flat.ebitda_margin, flat.ebitda_margin_variation_pct, '%'),
      operating_margin: toRatioValue(flat.operating_margin, flat.operating_margin_variation_pct, '%'),
      roa: toRatioValue(flat.roa, flat.roa_variation_pct, '%'),
      roe: toRatioValue(flat.roe, flat.roe_variation_pct, '%'),
    };

    const capacity: CapacityGroup = {
      cash_flow_capacity: toRatioValue(flat.cash_flow_capacity ?? null, flat.cash_flow_capacity_variation_pct ?? null),
      cf_capacity_margin: toRatioValue(flat.cash_flow_capacity_margin_pct ?? null, flat.cash_flow_capacity_margin_pct_variation_pct ?? null, '%'),
      operating_cash_flow: toRatioValue(null, 0, 'currency'),
    };

    const bd = flat.z_score_breakdown;
    const z_score: ZScoreGroup = {
      z_score_altman: toRatioValue(flat.z_score_altman, 0), // No variations for Z-Score
      z_score_zone: flat.z_score_zone || 'SAFE',
      formula_breakdown: {
        x1: bd?.x1 != null ? parseFloat(String(bd.x1)) : 0,
        x2: bd?.x2 != null ? parseFloat(String(bd.x2)) : 0,
        x3: bd?.x3 != null ? parseFloat(String(bd.x3)) : 0,
        x4: bd?.x4 != null ? parseFloat(String(bd.x4)) : 0,
      },
    };

    const allAlerts = (flat.coherence_alerts_json || []) as any[];
    const crossPillarCodes = ['FALSE_LIQUIDITY', 'HIDDEN_OVERLEVERAGE', 'TOXIC_WCR', 'SCISSORS_EFFECT'];

    return {
      case_id: flat.case_id,
      fiscal_year: flat.fiscal_year,
      liquidity,
      solvency,
      profitability,
      capacity,
      z_score,
      coherence_alerts: allAlerts
        .filter((a) => !crossPillarCodes.includes(a.pattern))
        .map((a) => ({
          id: a.id || Math.random().toString(),
          severity: a.severity || 'WARNING',
          rule_id: a.pattern || 'CUSTOM',
          message: a.description || '',
          rule_description: a.note || '',
          affected_ratios: [],
          suggested_action: '',
        })),
      cross_pillar_alerts: allAlerts
        .filter((a) => crossPillarCodes.includes(a.pattern))
        .map((a) => ({
          id: a.id || Math.random().toString(),
          severity: a.severity || 'WARNING',
          rule_id: a.pattern,
          message: a.description || '',
          rule_description: a.note || '',
          affected_ratios: [],
          suggested_action: '',
        })),
      coherence_status: flat.coherence_status || 'CLEAN',
      calculation_date: flat.computed_at,
      normalization_source: '',
      sector_code: '',
    };
  }

}
