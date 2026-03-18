import { ConsortiumMember } from './consortium.model';

export enum CaseType {
    SINGLE = 'SINGLE',
    GROUPEMENT = 'GROUPEMENT',
    LOTS = 'LOTS',
}

export enum CaseStatus {
    DRAFT = 'DRAFT',
    PENDING_GATE = 'PENDING_GATE',
    FINANCIAL_INPUT = 'FINANCIAL_INPUT',
    NORMALIZATION_DONE = 'NORMALIZATION_DONE',
    RATIOS_COMPUTED = 'RATIOS_COMPUTED',
    SCORING_DONE = 'SCORING_DONE',
    STRESS_DONE = 'STRESS_DONE',
    EXPERT_REVIEWED = 'EXPERT_REVIEWED',
    CLOSED = 'CLOSED',
    CANCELLED = 'CANCELLED',
}

export enum DocumentStatus {
    UPLOADED = 'UPLOADED',
    ANALYZED = 'ANALYZED',
    FLAGGED = 'FLAGGED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum GateVerdict {
    PASS = 'PASS',
    FAIL = 'FAIL',
    REVIEW = 'REVIEW',
}

export interface GroupementMember {
    name: string;
    role: 'LEADER' | 'MEMBER';
    participation_percentage: number;
}

export interface CaseCreate {
    // Etape 1: Info Marché
    case_type: CaseType;
    market_reference: string;
    market_label: string;
    contract_value: number;
    contract_currency: string;
    contract_duration_months: number;
    country: string;
    sector: string;
    sensitive: boolean;
    notes?: string;

    // Etape 2: Soumissionnaire
    bidder_id?: string | null; // Renseigné si sélectionné via recherche
    bidder_name?: string;      // Renseigné si nouveau soumissionnaire
    legal_form?: string;       // Renseigné si nouveau soumissionnaire
    registration_number?: string;
    email?: string;
    phone?: string;

    // Optionnel si case_type === GROUPEMENT
    members?: GroupementMember[];

    // Meta gérées par le Stepper
    status: 'DRAFT' | 'PENDING_GATE';
    case_manager_id?: string;
}

export interface StatusTransition {
    new_status: CaseStatus;
    reason?: string;
}

export interface EvaluationCaseOut {
    id: string;
    name: string;
    bidder_name: string;
    country: string;
    sector: string;
    contract_value: number;
    contract_currency: string;
    contract_months: number;
    case_type: CaseType;
    status: CaseStatus;
    created_at: string;
    updated_at: string;
    created_by: string;
    case_manager_id?: string;
    mcc_score?: number;
    ia_score?: number;
    risk_class?: string;
    notes?: string;
}

export interface EvaluationCaseDetailOut extends EvaluationCaseOut {
    documents?: any[];
    financial_statements?: any[];
    scorecard?: any;
    consortium_data?: ConsortiumMember[];
    expert_review?: any;
}

export interface CaseStatusResponse {
    case_id: string;
    current_status: CaseStatus;
    can_transition_to: CaseStatus[];
    last_transition_at: string;
    reason: string;
}

export interface BidderOut {
    id: string;
    name: string;
    country: string;
    sector: string;
    active_cases: number;
    last_evaluation_date?: string;
}

export function isCaseStatus(value: any): value is CaseStatus {
    return Object.values(CaseStatus).includes(value);
}

export function isCaseType(value: any): value is CaseType {
    return Object.values(CaseType).includes(value);
}