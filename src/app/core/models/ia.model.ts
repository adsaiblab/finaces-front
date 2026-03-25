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

export interface WhatIfScenario {
    scenario_name: string;
    feature_modifications: Record<string, number>;
    predicted_score_if?: number;
    predicted_class_if?: string;
}