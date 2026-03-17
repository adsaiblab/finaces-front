export interface ConsortiumMember {
    member_id: string;
    member_name: string;
    role: 'LEADER' | 'MEMBER';
    participation_pct: number;
    score?: number;
    risk_class?: string;
}

export interface ConsortiumMemberCreate {
    member_id: string;
    role: 'LEADER' | 'MEMBER';
    participation_pct: number;
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