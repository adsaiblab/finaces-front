export enum RiskClass {
    FAIBLE = 'FAIBLE',
    MODERE = 'MODERE',
    ELEVE = 'ELEVE',
    CRITIQUE = 'CRITIQUE',
}

export enum PillarLabel {
    INSUFFISANT = 'INSUFFISANT',
    FAIBLE = 'FAIBLE',
    MODERE = 'MODERE',
    FORT = 'FORT',
    TRES_FORT = 'TRES_FORT',
}

export enum TensionLevel {
    NONE = 'NONE',
    MILD = 'MILD',
    MODERATE = 'MODERATE',
    SEVERE = 'SEVERE',
}

export enum RiskProfile {
    EQUILIBRE = 'EQUILIBRE',
    ASYMETRIQUE = 'ASYMETRIQUE',
    AGRESSIF = 'AGRESSIF',
    DEFENSIF = 'DEFENSIF',
    CLASSIQUE = 'CLASSIQUE',
}

export interface RatioSetSchema {
    case_id: string;
    fiscal_year: number;
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    working_capital: number;
    bfr: number;
    bfr_pct_ca: number;
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
    altman_zscore: number;
    altman_zscore_zone: 'SAFE' | 'GREY' | 'DISTRESS';
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
    liquidite_score: number;
    liquidite_label: PillarLabel;
    liquidite_detail: PillarDetailSchema;
    solvabilite_score: number;
    solvabilite_label: PillarLabel;
    solvabilite_detail: PillarDetailSchema;
    rentabilite_score: number;
    rentabilite_label: PillarLabel;
    rentabilite_detail: PillarDetailSchema;
    capacite_score: number;
    capacite_label: PillarLabel;
    capacite_detail: PillarDetailSchema;
    qualite_score: number;
    qualite_label: PillarLabel;
    qualite_detail: PillarDetailSchema;
    global_score: number;
    risk_class: RiskClass;
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