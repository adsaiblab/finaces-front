import { RiskClass, ShapDirection, ShapMagnitude } from './enums';

export interface IAFeatureContribution {
  feature_name: string;
  feature_value: number;
  shap_value: number;
  impact: number;
  direction: ShapDirection;
  magnitude: ShapMagnitude;
}

export interface IAPredictionOut {
  id: string;
  case_id: string;
  ia_score: number;
  ia_risk_class: RiskClass;
  ia_probability_default: number;
  threshold_info: string;
  predicted_at: string;
  explanations: {
    top_features: IAFeatureContribution[];
    explanation_method: string;
    base_value: number;
  };
}

export interface WhatIfInput {
  scenario_name: string;
  parameter_overrides: Record<string, number>;
}

export interface WhatIfResult {
  scenario_name: string;
  predicted_score_if: number;
  predicted_class_if: RiskClass;
  delta_score: number;
  feature_impacts: IAFeatureContribution[];
}

export interface IAModelInfo {
  id: string;
  name: string;
  version: string;
  is_active: boolean;
  metrics: {
    auc_roc: number;
    accuracy: number;
    f1_score: number;
    feature_importance?: FeatureImportance[];
  };
  trained_at: string;
}

// Legacy aliases for backward compatibility
export interface IAPredictionResult {
  case_id: string;
  model_version: string;
  prediction_timestamp: string;
  predicted_score: number;
  predicted_risk_class: string;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  model_performance: {
    auc_roc: number;
    accuracy: number;
    f1_score: number;
  };
  shap_values: ShapExplanation;
  feature_importance: FeatureImportance[];
  disclaimer: string;
}

export interface ShapExplanation {
  base_value: number;
  features: ShapFeature[];
  total_contribution: number;
}

export interface ShapFeature {
  feature_name: string;
  feature_value: number | string;
  shap_value: number;
  direction: 'positive' | 'negative';
  magnitude: number;
}

export interface FeatureImportance {
  rank: number;
  feature_name: string;
  importance_score: number;
  correlation_with_target: number;
}

export type WhatIfScenarioInput = WhatIfInput;
export type WhatIfScenarioResult = WhatIfResult;
