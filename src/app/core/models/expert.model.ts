export interface ExpertReviewInputSchema {
    liquidity_comment: string;
    solvability_comment: string;
    profitability_comment: string;
    capacity_comment: string;
    quality_comment: string;
    dynamic_analysis_comment: string;
    mitigating_factors?: string;
    risk_factors?: string;
    override_recommendation?: string;
}

export interface ExpertReviewOutputSchema {
    case_id: string;
    review_id: string;
    expert_id: string;
    expert_name: string;
    reviewed_at: string;
    liquidity_comment: string;
    solvability_comment: string;
    profitability_comment: string;
    capacity_comment: string;
    quality_comment: string;
    dynamic_analysis_comment: string;
    mitigating_factors?: string;
    risk_factors?: string;
    override_recommendation?: string;
    approved: boolean;
    approved_at?: string;
}

export interface ConclusionUpdate {
    conclusion_text: string;
    final_recommendation: string;
    conditional_factors?: string[];
}