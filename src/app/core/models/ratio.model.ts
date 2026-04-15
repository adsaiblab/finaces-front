export interface RatioValue {
  current: number | null;
  trend: number[];
  benchmark_min: number;
  benchmark_max: number;
  status: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  unit: 'ratio' | '%' | 'days' | 'currency' | 'binary';
  variation_pct: number;
  analyst_note?: string;
}

export interface LiquidityGroup {
  current_ratio: RatioValue;
  quick_ratio: RatioValue;
  cash_ratio: RatioValue;
  working_capital: RatioValue;
  wcr: RatioValue;
  wcr_pct_revenue: RatioValue;
  dso_days: RatioValue;
  dpo_days: RatioValue;
  dio_days: RatioValue;
  cash_conversion_cycle: RatioValue;
}

export interface SolvencyGroup {
  debt_to_equity: RatioValue;
  financial_autonomy: RatioValue;
  gearing: RatioValue;
  interest_coverage: RatioValue;
  debt_repayment_years: RatioValue;
  negative_equity: RatioValue;
}

export interface ProfitabilityGroup {
  net_margin: RatioValue;
  ebitda_margin: RatioValue;
  operating_margin: RatioValue;
  roa: RatioValue;
  roe: RatioValue;
}

export interface CapacityGroup {
  cash_flow_capacity: RatioValue;
  cf_capacity_margin: RatioValue;
  operating_cash_flow: RatioValue;
}

export interface ZScoreGroup {
  z_score_altman: RatioValue;
  z_score_zone: 'SAFE' | 'GREY' | 'DISTRESS';
  formula_breakdown: {
    x1: number;
    x2: number;
    x3: number;
    x4: number;
  };
}

export interface CoherenceAlert {
  id: string;
  severity: 'WARNING' | 'CRITICAL';
  rule_id:
    | 'LIQUIDITY_ORDER'
    | 'BFR_FORMULA'
    | 'MARGIN_ORDER'
    | 'SOLVENCY_LOGIC'
    | 'ZSCORE_DISTRESS'
    | 'CUSTOM';
  message: string;
  rule_description: string;
  affected_ratios: string[];
  suggested_action: string;
  data_challenge?: boolean;
}

export interface RatioSetGrouped {
  case_id: string;
  fiscal_year: number;
  liquidity: LiquidityGroup;
  solvency: SolvencyGroup;
  profitability: ProfitabilityGroup;
  capacity: CapacityGroup;
  z_score: ZScoreGroup;
  coherence_alerts: CoherenceAlert[];
  coherence_status: 'CLEAN' | 'WARNINGS' | 'CRITICAL';
  calculation_date: string;
  normalization_source: string;
  sector_code: string;
}
