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

function toRatioValue(current: any, unit: RatioValue['unit'] = 'ratio'): RatioValue {
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
    variation_pct: 0,
  };
}

export class RatioMapper {
  /** Backend flat → Frontend grouped (for display) */
  static fromBackendFlat(flat: any): RatioSetGrouped {
    const liquidity: LiquidityGroup = {
      current_ratio: toRatioValue(flat.current_ratio),
      quick_ratio: toRatioValue(flat.quick_ratio),
      cash_ratio: toRatioValue(flat.cash_ratio),
      working_capital: toRatioValue(flat.working_capital, 'currency'),
      wcr: toRatioValue(flat.working_capital_requirement, 'currency'),
      wcr_pct_revenue: toRatioValue(flat.working_capital_requirement_pct_revenue, '%'),
      dso_days: toRatioValue(flat.dso_days, 'days'),
      dpo_days: toRatioValue(flat.dpo_days, 'days'),
      dio_days: toRatioValue(flat.dio_days ?? null, 'days'),
      cash_conversion_cycle: toRatioValue(flat.cash_conversion_cycle ?? null, 'days'),
    };

    const solvency: SolvencyGroup = {
      debt_to_equity: toRatioValue(flat.debt_to_equity),
      financial_autonomy: toRatioValue(flat.financial_autonomy),
      gearing: toRatioValue(flat.gearing),
      interest_coverage: toRatioValue(flat.interest_coverage ?? null),
      debt_repayment_years: toRatioValue(flat.debt_repayment_years ?? null),
      negative_equity: toRatioValue(flat.negative_equity ?? 0, 'binary'),
    };

    const profitability: ProfitabilityGroup = {
      net_margin: toRatioValue(flat.net_margin, '%'),
      ebitda_margin: toRatioValue(flat.ebitda_margin, '%'),
      operating_margin: toRatioValue(flat.operating_margin, '%'),
      roa: toRatioValue(flat.roa, '%'),
      roe: toRatioValue(flat.roe, '%'),
    };

    const capacity: CapacityGroup = {
      cash_flow_capacity: toRatioValue(flat.cash_flow_capacity ?? null),
      cf_capacity_margin: toRatioValue(flat.cash_flow_capacity_margin_pct ?? null, '%'),
      operating_cash_flow: toRatioValue(null, 'currency'),
    };

    const bd = flat.z_score_breakdown;
    const z_score: ZScoreGroup = {
      z_score_altman: toRatioValue(flat.z_score_altman),
      z_score_zone: flat.z_score_zone || 'SAFE',
      formula_breakdown: {
        x1: bd?.x1 != null ? parseFloat(String(bd.x1)) : 0,
        x2: bd?.x2 != null ? parseFloat(String(bd.x2)) : 0,
        x3: bd?.x3 != null ? parseFloat(String(bd.x3)) : 0,
        x4: bd?.x4 != null ? parseFloat(String(bd.x4)) : 0,
      },
    };

    return {
      case_id: flat.case_id,
      fiscal_year: flat.fiscal_year,
      liquidity,
      solvency,
      profitability,
      capacity,
      z_score,
      coherence_alerts: [],
      coherence_status: 'CLEAN',
      calculation_date: flat.computed_at,
      normalization_source: '',
      sector_code: '',
    };
  }
}
