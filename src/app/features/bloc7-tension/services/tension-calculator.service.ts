import { Injectable } from '@angular/core';
import { ScoringMccSchema, TensionLevel } from '../../../core/models/scoring.model';
import { IAPredictionResult } from '../../../core/models/ia.model';
import { TensionAnalysisResult, TensionDirection, PillarComparison } from '../../../core/models/tension.model';

@Injectable({
    providedIn: 'root'
})
export class TensionCalculatorService {

    public calculateTension(mccData: ScoringMccSchema, iaData: IAPredictionResult): TensionAnalysisResult {
        const mccScore = mccData.global_score;
        const iaScore = iaData.predicted_score;
        const delta = parseFloat((iaScore - mccScore).toFixed(2));
        const absDelta = Math.abs(delta);

        // 1. Determine Direction
        let direction: TensionDirection = 'FLAT';
        if (delta > 0) direction = 'UP';
        if (delta < 0) direction = 'DOWN';

        // 2. Determine Class Divergence
        const classDivergence = mccData.risk_class !== iaData.predicted_risk_class;

        // 3. Determine Level
        let level: TensionLevel = TensionLevel.NONE;
        if (absDelta >= 1.0 || (classDivergence && absDelta >= 0.8)) {
            level = TensionLevel.SEVERE;
        } else if (absDelta >= 0.5 || classDivergence) {
            level = TensionLevel.MODERATE;
        } else if (absDelta >= 0.2) {
            level = TensionLevel.MILD;
        }

        // 4. Generate Recommendation
        let recommendation = 'Scores are aligned. Proceed with MCC decision.';
        if (level === TensionLevel.SEVERE) {
            recommendation = 'Critical divergence detected. Deep investigation and senior escalation are strongly advised.';
        } else if (level === TensionLevel.MODERATE) {
            recommendation = 'Significant gap. Please justify the variance before proceeding.';
        } else if (level === TensionLevel.MILD) {
            recommendation = 'Minor deviation. Standard review is sufficient.';
        }

        // 5. Build Pillar Comparisons (Simplified heuristic mapping for UX display)
        const pillarsComparison: PillarComparison[] = mccData.pillars.map((p: any) => {
            // Pseudo-random mapping based on SHAP could be done here, 
            // but for UI consistency, we calculate a mock IA impact based on global delta.
            const mockIaImpact = parseFloat((p.score + (delta * (p.weight / 100))).toFixed(2));
            const pDelta = parseFloat((mockIaImpact - p.score).toFixed(2));
            return {
                pillar_name: p.name,
                mcc_score: p.score,
                ia_impact: mockIaImpact,
                delta: pDelta,
                is_divergent: Math.abs(pDelta) > 0.5
            };
        });

        return {
            level,
            direction,
            delta_score: delta,
            mcc_class: mccData.risk_class,
            ia_class: iaData.predicted_risk_class,
            class_divergence: classDivergence,
            pillars_comparison: pillarsComparison,
            system_recommendation: recommendation,
            requires_justification: level === TensionLevel.MODERATE || level === TensionLevel.SEVERE
        };
    }
}