import { TensionLevel } from './scoring.model';

export type TensionDirection = 'UP' | 'DOWN' | 'FLAT';

export interface PillarComparison {
    pillar_name: string;
    mcc_score: number;
    ia_impact: number; // Simulated or derived from SHAP if applicable, or just a mock delta for comparison
    delta: number;
    is_divergent: boolean;
}

export interface TensionAnalysisResult {
    level: TensionLevel; // NONE, MILD, MODERATE, SEVERE
    direction: TensionDirection;
    delta_score: number;
    mcc_class: string;
    ia_class: string;
    class_divergence: boolean;
    pillars_comparison: PillarComparison[];
    system_recommendation: string;
    requires_justification: boolean;
}

export interface AnalystDecisionPayload {
    decision: 'FOLLOW_MCC' | 'FOLLOW_IA' | 'INVESTIGATE';
    justification: string;
    escalate_to_senior: boolean;
}