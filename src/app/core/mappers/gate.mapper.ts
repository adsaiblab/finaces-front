import { GateDecisionOut } from '../models/gate.model';

export class GateMapper {
  static fromBackend(raw: any): GateDecisionOut {
    return {
      id: raw.id,
      case_id: raw.case_id,
      verdict: raw.verdict,
      reliability_level: raw.reliability_level,
      missing_docs: [
        ...(raw.missing_mandatory ?? []),
        ...(raw.missing_optional ?? []),
      ],
      computed_at: raw.computed_at,
    };
  }
}
