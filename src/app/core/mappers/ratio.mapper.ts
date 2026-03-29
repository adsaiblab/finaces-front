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

function toRatioValue(
  current: number,
  unit: RatioValue['unit'] = 'ratio',
): RatioValue {
  return {
    current,
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
  static fromBackendFlat(flat: RatioSetFlat): RatioSetGrouped {
    const liquidity: LiquidityGroup = {
      current_ratio: toRatioValue(flat.current_ratio),
      quick_ratio: toRatioValue(flat.quick_ratio),
      cash_ratio: toRatioValue(flat.cash_ratio),
      working_capital: toRatioValue(flat.working_capital, 'currency'),
      wcr: toRatioValue(flat.wcr, 'currency'),
      wcr_pct_revenue: toRatioValue(flat.wcr_pct_revenue, '%'),
      dso_days: toRatioValue(flat.dso_days, 'days'),
      dpo_days: toRatioValue(flat.dpo_days, 'days'),
      dio_days: toRatioValue(0, 'days'),
      cash_conversion_cycle: toRatioValue(0, 'days'),
    };

    const solvency: SolvencyGroup = {
      debt_to_equity: toRatioValue(flat.debt_to_equity),
      financial_autonomy: toRatioValue(flat.equity_ratio),
      gearing: toRatioValue(flat.gearing),
      interest_coverage: toRatioValue(0),
      debt_repayment_years: toRatioValue(0),
      negative_equity: toRatioValue(flat.equity_ratio < 0 ? 1 : 0, 'binary'),
    };

    const profitability: ProfitabilityGroup = {
      net_margin: toRatioValue(flat.net_margin, '%'),
      ebitda_margin: toRatioValue(flat.ebitda_margin, '%'),
      operating_margin: toRatioValue(flat.operating_margin, '%'),
      roa: toRatioValue(flat.roa, '%'),
      roe: toRatioValue(flat.roe, '%'),
    };

    const capacity: CapacityGroup = {
      cash_flow_capacity: toRatioValue(0),
      cf_capacity_margin: toRatioValue(0, '%'),
      operating_cash_flow: toRatioValue(0, 'currency'),
    };

    const z_score: ZScoreGroup = {
      z_score_altman: toRatioValue(flat.altman_zscore),
      z_score_zone: flat.altman_zscore_zone,
      formula_breakdown: { x1: 0, x2: 0, x3: 0, x4: 0 },
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
