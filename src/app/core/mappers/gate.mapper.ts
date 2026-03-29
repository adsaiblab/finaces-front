import { GateVerdict, ReliabilityLevel } from '../models/enums';
import { GateDecisionOut } from '../models/gate.model';

/** Shape returned by backend POST /cases/{id}/gate/evaluate */
interface BackendGateDecision {
  id?: string;
  case_id?: string;
  is_passed: boolean;
  verdict: GateVerdict;
  reliability_level: ReliabilityLevel;
  reliability_score: number;
  missing_mandatory: string[];
  missing_optional: string[];
  blocking_reasons: string[];
  reserve_flags: string[];
  computed_at: string;
}

export class GateMapper {
  static fromBackend(raw: BackendGateDecision): GateDecisionOut {
    return {
      id: raw.id ?? '',
      case_id: raw.case_id ?? '',
      verdict: raw.verdict,
      reliability_level: raw.reliability_level,
      missing_docs: [...(raw.missing_mandatory ?? []), ...(raw.missing_optional ?? [])],
      computed_at: raw.computed_at,
    };
  }
}
