import { PillarLabel } from '../../core/models/enums';

// [UI SIMULATION] - This interface defines the target structure for detailed member scoring.
// Currently simulated in the UI while waiting for Backend updates.
export interface UiDetailedPillarScore {
  name: string;
  score: number; // 0 to 5
  label: PillarLabel;
  comment?: string;
  risk_factors?: string[];
  mitigating_factors?: string[];
}

export interface UiMemberDetailedScoring {
  member_id: string;
  pillars: Record<string, UiDetailedPillarScore>;
}
