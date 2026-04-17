import { RiskClass, RiskProfile, PillarLabel } from './enums';

export interface PillarDetail {
  id: string;
  name: string;
  score: number;
  weight: number;
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING' | null;
  signals: string[];
  detail_text: string;
}

export interface ScorecardOut {
  id: string;
  case_id: string;
  fiscal_year: number;
  pillars: PillarDetail[];
  system_calculated_score: number;
  system_risk_class: RiskClass;
  base_risk_class: RiskClass;
  is_overridden: boolean;
  override_rationale: string | null;
  risk_profile: RiskProfile;
  cross_analysis_alerts: string[];
  trends_summary: string | null;
  synergy_index: number | null;
  synergy_bonus: number | null;
  ia_score: number | null;
  tension_level: string | null;
  tension_comment: string | null;
  version: number;
  created_at: string;
}

// Legacy aliases for backward compatibility

export enum TensionLevel {
  NONE = 'NONE',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export interface RatioSetFlat {
  case_id: string;
  fiscal_year: number;
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  working_capital: number;
  wcr: number;
  wcr_pct_revenue: number;
  dso_days: number;
  dpo_days: number;
  debt_to_equity: number;
  gearing: number;
  debt_to_assets: number;
  equity_ratio: number;
  gross_margin: number;
  operating_margin: number;
  ebitda_margin: number;
  net_margin: number;
  roe: number;
  roa: number;
  roi: number;
  roic: number;
  cagr_revenue?: number;
  asset_turnover: number;
  equity_multiplier: number;
  z_score_altman: number | null;
  z_score_zone: 'SAFE' | 'GREY' | 'DISTRESS' | null;
  computed_at: string;
}

export interface PillarDetailSchema {
  pillar_name: string;
  score: number;
  label: PillarLabel;
  ratios_used: string[];
  comment: string;
}

export interface ScorecardOutputSchema {
  case_id: string;
  scorecard_id: string;
  fiscal_year: number;
  liquidity_score: number;
  liquidity_label: PillarLabel;
  liquidity_detail: PillarDetailSchema;
  solvency_score: number;
  solvency_label: PillarLabel;
  solvency_detail: PillarDetailSchema;
  profitability_score: number;
  profitability_label: PillarLabel;
  profitability_detail: PillarDetailSchema;
  capacity_score: number;
  capacity_label: PillarLabel;
  capacity_detail: PillarDetailSchema;
  quality_score: number;
  quality_label: PillarLabel;
  quality_detail: PillarDetailSchema;
  global_score: number;
  risk_class: RiskClass | string;
  risk_profile: RiskProfile;
  ia_score?: number;
  tension_level?: TensionLevel;
  tension_comment?: string;
  expert_comment?: string;
  expert_reviewed_at?: string;
  expert_reviewed_by?: string;
  created_at: string;
  computed_at: string;
  version: string;
  cross_analysis_alerts: string[];
  overrides?: OverrideRecord[];
}

export interface OverrideRecord {
  original_score: number;
  adjusted_score: number;
  override_type: string;
  justification: string;
  authorized_by: string;
  applied_at: string;
}

export interface RecommendationUpdate {
  recommendation: string;
  conditions?: string[];
  risk_factors?: string[];
}

export interface PillarScore {
  id: string;
  name: string;
  score: number;
  weight: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  key_drivers: string[];
}

export interface ScoreOverride {
  original_score: number;
  new_score: number;
  original_risk_class: string;
  new_risk_class: string;
  reason: string;
  author: string;
  timestamp: string;
}

export interface ScoringRecommendation {
  id: string;
  type: 'POSITIVE' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface ScoringMccSchema {
  case_id: string;
  global_score: number;
  risk_class: string;
  calculation_date: string;
  pillars: PillarScore[];
  recommendations: ScoringRecommendation[];
  cross_analysis_alerts: string[];
  override?: ScoreOverride;
  status: 'COMPUTED' | 'OVERRIDDEN';
}

export interface ScoreOverridePayload {
  new_score: number;
  reason: string;
}
