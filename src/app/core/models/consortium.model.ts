import { RiskClass, JVType } from './enums';

export interface ConsortiumMemberCreate {
  bidder_id: string;
  bidder_name: string;
  role: 'LEADER' | 'MEMBER';
  participation_pct: number;
}

export interface ConsortiumMemberOut extends ConsortiumMemberCreate {
  id: string;
  score_global: number | null;
  final_risk_class: RiskClass | null;
  stress_60d_result: string | null;
}

export interface ConsortiumOut {
  case_id: string;
  jv_type: JVType;
  members: ConsortiumMemberOut[];
  weak_link_triggered: boolean;
  weak_link_member: string | null;
  leader_blocking: boolean;
  weighted_score: number;
  synergy_bonus: number;
  mitigations_suggested: string[];
}

// Legacy aliases for backward compatibility
export interface ConsortiumMember {
  member_id: string;
  member_name: string;
  role: 'LEADER' | 'MEMBER';
  participation_pct: number;
  score?: number;
  risk_class?: string;
  status?: 'ACTIVE' | 'WITHDRAWN';
}

export interface ConsortiumScorecardOutput {
  consortium_id: string;
  members: ConsortiumMember[];
  joint_venture_type: 'SOLIDAIRE' | 'CONJOINTE' | 'SEPARATE';
  synergy_index: number;
  weakest_member_id: string;
  combined_scorecard: any;
  member_scorecards: Record<string, any>;
  strength_ratio: number;
  recommendations: string[];
}
