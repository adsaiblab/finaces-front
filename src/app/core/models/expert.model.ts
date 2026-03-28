import { OverrideRecommendation } from './enums';

export interface ExpertReviewCreate {
  analyst_id: string;
  liquidity_comment: string;
  solvability_comment: string;
  profitability_comment: string;
  capacity_comment: string;
  quality_comment: string;
  dynamic_analysis_comment: string;
  mitigating_factors: string[];
  risk_factors: string[];
  override_recommendation: OverrideRecommendation;
}

export interface ExpertReviewOut extends ExpertReviewCreate {
  id: string;
  case_id: string;
  final_decision: 'APPROVED' | 'REJECTED' | 'ESCALATED';
  computed_at: string;
}

// Legacy aliases for backward compatibility
export type ExpertReviewInputSchema = Omit<ExpertReviewCreate, 'analyst_id' | 'mitigating_factors' | 'risk_factors' | 'override_recommendation'> & {
  mitigating_factors?: string[];
  risk_factors?: string[];
  override_recommendation?: OverrideRecommendation;
};

export { OverrideRecommendation };

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
  override_recommendation?: OverrideRecommendation;
  approved: boolean;
  approved_at?: string;
}

export interface ConclusionUpdate {
  conclusion_text: string;
  final_recommendation: string;
  conditional_factors?: string[];
}

export interface MccCondition {
  type: 'CAUTION' | 'REPORTING' | 'PLAFOND' | 'CLAUSE_REVISION' | 'AUDIT' | 'AUTRE';
  description: string;
  importance: 'OBLIGATOIRE' | 'RECOMMANDÉE';
  dueDate?: string;
}
