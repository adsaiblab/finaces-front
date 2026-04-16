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

  /**
   * Computes variation_pct for each RatioValue field in `current` relative to `previous`.
   * Formula: (N - N-1) / |N-1| * 100
   * Mutates current in place and returns it for chaining.
   * The oldest year (no predecessor) keeps variation_pct = 0.
   */
  static applyVariations(current: RatioSetGrouped, previous: RatioSetGrouped): RatioSetGrouped {
    const vp = (cur: RatioValue, prev: RatioValue): void => {
      if (cur?.current != null && prev?.current != null && prev.current !== 0) {
        cur.variation_pct = parseFloat(
          (((cur.current - prev.current) / Math.abs(prev.current)) * 100).toFixed(1)
        );
      }
    };

    // Liquidity pillar
    const lCur = current.liquidity;
    const lPrev = previous.liquidity;
    vp(lCur.current_ratio, lPrev.current_ratio);
    vp(lCur.quick_ratio, lPrev.quick_ratio);
    vp(lCur.cash_ratio, lPrev.cash_ratio);
    vp(lCur.working_capital, lPrev.working_capital);
    vp(lCur.wcr, lPrev.wcr);
    vp(lCur.wcr_pct_revenue, lPrev.wcr_pct_revenue);
    vp(lCur.dso_days, lPrev.dso_days);
    vp(lCur.dpo_days, lPrev.dpo_days);
    vp(lCur.dio_days, lPrev.dio_days);
    vp(lCur.cash_conversion_cycle, lPrev.cash_conversion_cycle);

    // Solvency pillar
    const sCur = current.solvency;
    const sPrev = previous.solvency;
    vp(sCur.debt_to_equity, sPrev.debt_to_equity);
    vp(sCur.financial_autonomy, sPrev.financial_autonomy);
    vp(sCur.gearing, sPrev.gearing);
    vp(sCur.interest_coverage, sPrev.interest_coverage);
    vp(sCur.debt_repayment_years, sPrev.debt_repayment_years);
    vp(sCur.negative_equity, sPrev.negative_equity);

    // Profitability pillar
    const pCur = current.profitability;
    const pPrev = previous.profitability;
    vp(pCur.net_margin, pPrev.net_margin);
    vp(pCur.ebitda_margin, pPrev.ebitda_margin);
    vp(pCur.operating_margin, pPrev.operating_margin);
    vp(pCur.roa, pPrev.roa);
    vp(pCur.roe, pPrev.roe);

    // Capacity pillar
    const cCur = current.capacity;
    const cPrev = previous.capacity;
    vp(cCur.cash_flow_capacity, cPrev.cash_flow_capacity);
    vp(cCur.cf_capacity_margin, cPrev.cf_capacity_margin);
    vp(cCur.operating_cash_flow, cPrev.operating_cash_flow);

    // Z-Score
    vp(current.z_score.z_score_altman, previous.z_score.z_score_altman);

    return current;
  }
}

