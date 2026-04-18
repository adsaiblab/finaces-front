import {
  ScorecardOut,
  PillarDetail,
  ScorecardOutputSchema,
  PillarDetailSchema,
} from '../models/scoring.model';

/**
 * Backend returns ScorecardOut with pillars[] array.
 * This mapper converts it to the standardized ScorecardOutputSchema used by the UI.
 */

function toPillarDetailSchema(p: PillarDetail): PillarDetailSchema {
  return {
    id: p.id ?? '',
    name: p.name ?? 'Unknown',
    score: p.score ?? 0,
    weight: p.weight ?? 0,
    status: scoreToPillarStatus(p.score ?? 0),
    key_drivers: p.key_drivers ?? [],
    detailText: p.detail_text ?? '',
    signals: p.signals ?? [],
    trend: undefined,
  };
}

function scoreToPillarStatus(score: number): PillarDetailSchema['status'] {
  if (score >= 4.5) return 'EXCELLENT';
  if (score >= 3.5) return 'GOOD';
  if (score >= 2.5) return 'FAIR';
  if (score >= 1.5) return 'POOR';
  return 'CRITICAL';
}

export class ScorecardMapper {
  /** Backend ScorecardOut (pillars[]) → Standardized ScorecardOutputSchema */
  static fromBackend(back: ScorecardOut): ScorecardOutputSchema {
    return {
      case_id: back.case_id,
      system_calculated_score: back.system_calculated_score,
      system_risk_class: back.system_risk_class,
      global_score: back.system_calculated_score,
      base_risk_class: back.base_risk_class,
      is_overridden: back.is_overridden,
      final_risk_class: back.is_overridden ? back.base_risk_class : back.system_risk_class,
      override_rationale: back.override_rationale ?? null,
      risk_profile: back.risk_profile ?? null,
      risk_description: null,
      synergy_index: back.synergy_index ?? null,
      synergy_bonus: back.synergy_bonus ?? null,
      cross_analysis_alerts: back.cross_analysis_alerts ?? [],
      trends_summary: {},
      pillars: (back.pillars ?? []).map(toPillarDetailSchema),
      smart_recommendations: [],
      overrides_applied: [],
      computed_at: back.created_at,
      version: String(back.version),
    };
  }
}
