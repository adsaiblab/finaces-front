import { RiskClass, RiskProfile, PillarLabel } from './enums';

export interface PillarDetail {
  id: string;
  name: string;
  score: number;
  weight: number;
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING' | null;
  signals: string[];
  key_drivers: string[];
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
  id: string;
  name: string;
  score: number;
  weight: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  key_drivers: string[];
  detailText: string;
  signals?: string[];
  trend?: number[];
}

export interface ScorecardOutputSchema {
  case_id: string;
  system_calculated_score: number;
  system_risk_class: RiskClass | string;
  
  global_score: number;
  base_risk_class: RiskClass | string;
  
  is_overridden: boolean;
  final_risk_class: RiskClass | string;
  override_rationale: string | null;
  
  risk_profile: string | null;
  risk_description: string | null;
  
  synergy_index: number | null;
  synergy_bonus: number | null;
  
  cross_analysis_alerts: string[];
  trends_summary: Record<string, string>;
  
  pillars: PillarDetailSchema[];
  smart_recommendations: string[];
  overrides_applied: any[];
  
  computed_at: string;
  calculation_date?: string;
  version?: string;
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

export interface ScoreOverridePayload {
  new_score: number;
  reason: string;
}
