import { PillarLabel, RiskClass, RiskProfile } from '../models/enums';
import {
  ScorecardOut,
  PillarDetail,
  ScorecardOutputSchema,
  PillarDetailSchema,
} from '../models/scoring.model';

/**
 * Backend returns ScorecardOut with pillars[] array.
 * Legacy frontend expects ScorecardOutputSchema with denormalized pillar fields.
 * This mapper converts between the two representations.
 */

const PILLAR_ORDER = ['liquidity', 'solvency', 'profitability', 'capacity', 'quality'] as const;

function toPillarLabel(score: number): PillarLabel {
  if (score >= 4.5) return PillarLabel.VERY_STRONG;
  if (score >= 3.5) return PillarLabel.STRONG;
  if (score >= 2.5) return PillarLabel.MODERATE;
  if (score >= 1.5) return PillarLabel.WEAK;
  return PillarLabel.INADEQUATE;
}

function toPillarDetailSchema(p: PillarDetail): PillarDetailSchema {
  return {
    pillar_name: p.name ?? 'Unknown Pillar',
    score: p.score ?? 0,
    label: toPillarLabel(p.score ?? 0),
    ratios_used: p.signals ?? [],
    comment: p.detail_text ?? '',
  };
}

export class ScorecardMapper {
  /** Backend ScorecardOut (pillars[]) → Legacy ScorecardOutputSchema (denormalized) */
  static fromBackend(back: ScorecardOut): ScorecardOutputSchema {
    const pillarMap = new Map<string, PillarDetail>();
    for (const p of back.pillars) {
      pillarMap.set(p.name.toLowerCase(), p);
    }

    function getPillar(name: string): PillarDetail {
      return (
        pillarMap.get(name) ?? {
          id: '',
          name: name ? (name.charAt(0).toUpperCase() + name.slice(1)) : 'Unknown Pillar',
          score: 0,
          weight: 0,
          trend: null,
          signals: [],
          detail_text: '',
        }
      );
    }

    const liq = getPillar('liquidity');
    const sol = getPillar('solvency');
    const pro = getPillar('profitability');
    const cap = getPillar('capacity');
    const qua = getPillar('quality');

    return {
      case_id: back.case_id,
      scorecard_id: back.id,
      fiscal_year: back.fiscal_year,
      liquidity_score: liq.score,
      liquidity_label: toPillarLabel(liq.score),
      liquidity_detail: toPillarDetailSchema(liq),
      solvency_score: sol.score,
      solvency_label: toPillarLabel(sol.score),
      solvency_detail: toPillarDetailSchema(sol),
      profitability_score: pro.score,
      profitability_label: toPillarLabel(pro.score),
      profitability_detail: toPillarDetailSchema(pro),
      capacity_score: cap.score,
      capacity_label: toPillarLabel(cap.score),
      capacity_detail: toPillarDetailSchema(cap),
      quality_score: qua.score,
      quality_label: toPillarLabel(qua.score),
      quality_detail: toPillarDetailSchema(qua),
      global_score: back.system_calculated_score,
      risk_class: back.system_risk_class,
      risk_profile: back.risk_profile,
      ia_score: back.ia_score ?? undefined,
      tension_level: back.tension_level as any,
      tension_comment: back.tension_comment ?? undefined,
      created_at: back.created_at,
      computed_at: back.created_at,
      version: String(back.version),
      cross_analysis_alerts: back.cross_analysis_alerts ?? [],
      overrides:
        back.is_overridden && back.override_rationale
          ? [
              {
                original_score: back.system_calculated_score,
                adjusted_score: back.system_calculated_score,
                override_type: 'MANUAL',
                justification: back.override_rationale,
                authorized_by: '',
                applied_at: back.created_at,
              },
            ]
          : [],
    };
  }
}
