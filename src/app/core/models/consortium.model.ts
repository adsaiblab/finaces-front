import { ConsortiumMember } from './case.model';

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

export { ConsortiumMember };