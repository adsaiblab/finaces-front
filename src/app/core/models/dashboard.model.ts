// src/app/core/models/dashboard.model.ts
import { Case } from './case.model';

export interface DashboardStatsOut {
    total_active_cases: number;
    cases_pending_gate: number;
    cases_with_tension_alert: number;
    convergence_percentage: number;
    avg_mcc_score_7days: number;
    avg_ia_score_7days: number;
    divergences_count_7days: number;
    last_updated: string;
}

export interface ConvergenceChartOut {
    dates: string[];
    mcc_scores: number[];
    ia_scores: number[];
    divergence_flags: boolean[];
    correlation: number;
    convergence_percentage: number;
}

// L'alerte de tension est essentiellement une vue allégée ou complète d'un cas avec divergence
export type TensionAlertOut = Case;